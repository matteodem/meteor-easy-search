'use strict';

var ElasticSearchClient,
  Future = Npm.require('fibers/future'),
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
    newDoc[key] = "string" === typeof value ? value : JSON.stringify(value);
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
   */
  'writeToIndex' : function (name, doc, id) {
    var config = EasySearch.config() || {};

    // add to index
    ElasticSearchClient.index({
      index : name,
      type : 'default',
      id : id,
      body : doc
    }, function (err, data) {
      if (err) {
        console.log('Had error adding a document!');
        console.log(err);
      }

      if (config.debug && console) {
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
      config = EasySearch.config() || {};

    if ("undefined" === typeof ElasticSearchClient) {
      ElasticSearchClient = new ElasticSearch.Client(this._esDefaultConfig);
    }

    options.collection.find().observeChanges({
      added: function (id, fields) {
        searcherScope.writeToIndex(name, getESFields(fields), id);
      },
      changed: function (id, fields) {
        // Overwrites the current document with the new doc
        searcherScope.writeToIndex(name, getESFields(options.collection.findOne(id)), id);
      },
      removed: function (id) {
        ElasticSearchClient.delete({
          index: name,
          type: 'default',
          id: id
        }, function (error, response) {
          if (config.debug) {
            console.log('Removed document with id ( ' +  id + ' )!');
          }
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
      var mongoDbDocFake = resultSet['_source'];

      mongoDbDocFake['_id'] = resultSet['_id'];

      return resultSet['_source'];
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
      "query" : index.query(searchString),
      "sort" : index.sort(searchString),
      "size" : options.limit
    };

    if ("function" === typeof callback) {
      ElasticSearchClient.search(name, queryObj, callback);
      return;
    }

    // Most likely client call, return data set
    ElasticSearchClient.search({
      index : name,
      body : bodyObj
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
   * @param {String} searchString
   * @return array
   */
  'defaultQuery' : function (options, searchString) {
    return {
      "fuzzy_like_this" : {
        "fields" : options.field,
        "like_text" : searchString
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
    return options.field;
  }
});
