'use strict';

var Future = Npm.require('fibers/future'),
  ElasticSearch = Npm.require('elasticsearch');

function deep(obj, key, value) {
    var keys = key.replace(/\[(["']?)([^\1]+?)\1?\]/g, '.$2').replace(/^\./, '').split('.'),
        root,
        i = 0,
        n = keys.length;

    // Set deep value
    if (arguments.length > 2) {

      root = obj;
      n--;

      while (i < n) {
        key = keys[i++];
        obj = obj[key] = _.isObject(obj[key]) ? obj[key] : {};
      }

      obj[keys[i]] = value;

      value = root;

    // Get deep value
    } else {
      while ((obj = obj[keys[i++]]) != null && i < n) {};
      value = i < n ? void 0 : obj;
    }

    return value;
}

/**
 * Like _.pick(), but is compatible with object path.
 *
 * @param {Object} obj
 * @returns {Object}
 */
function deepPick(obj) {
    var ArrayProto = Array.prototype;
    var copy = {};
    var keys = ArrayProto.concat.apply(ArrayProto, ArrayProto.slice.call(arguments, 1));
    _.each(keys, function(key) {
        var val = deep(obj, key);
        if (!_.isUndefined(val)) deep(copy, key, val);
    });
    return copy;
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

    doc = deepPick(doc, opts.field);

    // add to index
    EasySearch.ElasticSearchClient.index({
      index : name.toLowerCase(),
      type : 'default',
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
      config = EasySearch.config() || {};

    if ("undefined" === typeof EasySearch.ElasticSearchClient) {
      EasySearch.ElasticSearchClient = new ElasticSearch.Client(this._esDefaultConfig);
    }

    name = name.toLowerCase();

    options.collection.find().observeChanges({
      added: function (id, fields) {
        searcherScope.writeToIndex(name, fields, id, options, config);
      },
      changed: function (id) {
        // Overwrites the current document with the new doc
        searcherScope.writeToIndex(name, options.collection.findOne(id), id, options, config);
      },
      removed: function (id) {
        EasySearch.ElasticSearchClient.delete({
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
      var field = '_source';

      if (resultSet['fields']) {
        field = 'fields';
      }

      resultSet[field]['_id'] = resultSet['_id'];
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

    bodyObj.sort = index.sort(searchString, options);

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

// Expose ElasticSearch API
EasySearch.ElasticSearch = ElasticSearch;
