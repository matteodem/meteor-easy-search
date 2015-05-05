'use strict';

var Future = Npm.require('fibers/future'),
  ElasticSearch = Npm.require('elasticsearch');

/**
 * Return Elastic Search indexable data.
 *
 * @param {Object} doc the document to get the values from
 * @return {Object}
 */
function getESFields(doc) {
  var newDoc = {};

  _.each(doc, function (value, key) {
    newDoc[key] = _.isObject(value) && !_.isArray(value) && !_.isDate(value) ? JSON.stringify(value) : value;
  });

  return newDoc;
}

EasySearch.createSearcher('elastic-search', {
  /**
   * Write a document to a specified index.
   *
   * @param {String} name
   * @param {Object} doc
   * @param {String} id
   * @param {Object} opts
   * @param {Object} config
   */
  'writeToIndex' : function (name, doc, id, opts, config) {
    var debugMode = config.debug,
        transformedDoc = opts.transform(doc);

    if (_.isObject(transformedDoc)) {
      doc = transformedDoc;
    }

    // add to index
    EasySearch.ElasticSearchClient.index({
      index : name.toLowerCase(),
      type : opts.type,
      id : id,
      body : doc
    }, function (err, data) {
      if (err) {
        console.log('Had error adding a document!');
        console.log(err);
      }

      if (debugMode && console) {
        console.log('EasySearch: Added / Replaced document to Elastic Search:');
        console.log('EasySearch: ' + data + "\n");
      }
    });
  },
  /**
   * Setup some observers on the mongo db collection provided.
   *
   * @param {String} name
   * @param {Object} options
   */
  'createSearchIndex' : function (name, options) {
    var searcherScope = this,
      fut = new Future(),
      config = EasySearch.config() || {};
    var debugMode = config.debug;

    if ("undefined" === typeof EasySearch.ElasticSearchClient) {
      EasySearch.ElasticSearchClient = new ElasticSearch.Client(this._esDefaultConfig);
    }

    name = name.toLowerCase();

    // Create the mapping
    if (debugMode) console.log('deleting index if exists');       
    EasySearch.ElasticSearchClient.indices.delete({
        index: name,
        ignore: [404]
    }).then(function () {
        if (debugMode) console.log('creating index');
        if(options.settings !== {}){
          return EasySearch.ElasticSearchClient.indices.create({
              index: name,
              type: options.type,
              body: {settings: options.settings}
          });
        }else{return;}
    }).then(function () {
        if (debugMode) console.log('adding mapping');
        if(options.mapping !== {}){
          return EasySearch.ElasticSearchClient.indices.putMapping({
              index: name,
              type: options.type,
              body: options.mapping
          });
        }else{return;}
    }).then(function () {
      if (debugMode) console.log('index + mapping = done');
      fut.return();   
    });
   
    fut.wait();
    if (debugMode) console.log('observeChanges');
    options.collection.find().observeChanges({
      added: function (id, fields) {
        searcherScope.writeToIndex(name, getESFields(fields), id, options, config);
      },
      changed: function (id) {
        // Overwrites the current document with the new doc
        searcherScope.writeToIndex(name, getESFields(options.collection.findOne(id)), id, options, config);
      },
      removed: function (id) {
        EasySearch.ElasticSearchClient.delete({
          index: name,
          type: options.type,
          id: id
        }, function (error, response) {
          if (debugMode) console.log('Removed document with id ( ' +  id + ' )!');
        });
      }
    });
  },
  /**
   * Get the data out of the JSON elastic search response.
   *
   * @param {Object} data
   * @returns {Array}
   */
  'extractJSONData' : function (data) {
    data = _.isString(data) ? JSON.parse(data) : data;

    var results = _.map(data.hits.hits, function (resultSet) {
      var field = '_source';

      if (resultSet['fields']) {
        field = 'fields';
      }

      resultSet[field]['_id'] = resultSet['_id'];
      resultSet[field]['_score'] = resultSet['_score'];
      
      return resultSet[field];
    });

    return {
      'results' : results,
      'total' : data.hits.total
    };
  },
  /**
   * Perform a search with Elastic Search, using fibers.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   * @param {Function} callback
   * @returns {*}
   */
  'search' : function (name, searchString, options, callback) {
    var bodyObj,
      that = this,
      fut = new Future(),
      index = EasySearch.getIndex(name);

    if (!_.isObject(index)) {
      return;
    }

    bodyObj = {
      "query" : index.query(searchString, options)
    };

    if (!bodyObj.query) {
      return { total: 0, results: [] };
    }

    // @todo function convert http://jsfiddle.net/MdHDR/7/
    var sortValues = "_score";//index.sort(searchString, options);

    if (options.returnFields) {
      if (options.returnFields.indexOf('_id') === -1 ) {
        options.returnFields.push('_id');
      }

      bodyObj.fields = options.returnFields;
    }

    // Modify Elastic Search body if wished
    if (index.body && _.isFunction(index.body)) {
      bodyObj = index.body(bodyObj, options);
    }

    name = name.toLowerCase();

    if ("function" === typeof callback) {
      EasySearch.ElasticSearchClient.search(name, bodyObj, callback);
      return;
    }

    // Most likely client call, return data set
    EasySearch.ElasticSearchClient.search({
      trackScores: true, 
      sort: sortValues,
      index : name,
      body : bodyObj,
      size : options.limit,
      from: options.skip
    }, function (error, data) {
      if (error) {
        console.log('Had an error while searching!');
        console.log(error);
        return;
      }

      if ("raw" !== index.format) {
        data = that.extractJSONData(data);
      }

      fut['return'](data);
    });

    return fut.wait();
  },
  /**
   * The default ES query object used for searching the results.
   *
   * @param {Object} options
   * @param {Object} searchObject
   * @return array
   */
  'defaultQuery' : function (options, searchObject) {
    return {
      "fuzzy_like_this" : {
        "fields" : options.field,
        "like_text" : searchObject.value
      }
    };
  },

  /**
   * The default ES sorting method used for sorting the results.
   *
   * @param {Object} options
   * @return array
   */
  'defaultSort' : function (options) {
    return {"_score":-1};
  }
});

// Expose ElasticSearch API
EasySearch.ElasticSearch = ElasticSearch;
