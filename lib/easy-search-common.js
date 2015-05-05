EasySearch = (function () {
  'use strict';

  var ESCounts,
    Searchers,
    indexes = {/** @see defaultOptions */},
    defaultOptions = {
      'format' : 'mongo',
      'skip' : 0,
      'limit' : 10,
      'type' : 'default',//Elasticsearch
      'mapping':{},//Elasticsearch
      'settings':{},//Elasticsearch
      'use' : 'minimongo',
      'reactive' : true,
      'props' : {},
      'transformResults' : function (res) {return res;},
      'transform' : function (doc) {return doc;},
      'sort' : function () {
        if (Searchers[this.use]) {
          return Searchers[this.use].defaultSort(this);
        }

        return {};
      },
      'reactiveSort' : function () {
          return this.sort();
      },
      'count' : function () {
        var doc = ESCounts.findOne({ _id : this.name });

        if (doc) {
          return doc.count;
        }

        return 0;
      },
      'changeResults' : function (results) {
        return results;
      },
      /**
       * When using elastic-search it's the query object,
       * while using with mongo-db it's the selector object.
       *
       * @param {String} searchString
       * @param {Object} options
       * @return {Object}
       */
      'query' : function (searchString, options) {
        return Searchers[this.use].defaultQuery(this, searchString);
      }
    };

  ESCounts = new Mongo.Collection('esCounts');

  /** Helper Functions */
  function setUpPublication(name, opts) {
    Meteor.publish(name + '/easySearch', function (conf) {
      var resultSet, 
        findOptions = {},
        resultArray = [],
        publishScope = this,
        publishHandle;

      check(conf, { value: Match.Optional(Object), skip: Number, limit: Match.Optional(Number), props: Object });

      indexes[name].skip = conf.skip;
      indexes[name].limit = conf.limit || indexes[name].limit;
      indexes[name].props = _.extend(indexes[name].props, conf.props);
      indexes[name].publishScope = this;

      resultSet = Searchers[opts.use].search(name, conf.value, indexes[name]);

      ESCounts.update({ _id: name }, { $set: { count: resultSet.total } }, { upsert: true });

      if (!resultSet.results.length) return this.ready();

      if (_.isObject(resultSet.results[0])) {
        resultArray = _.pluck(resultSet.results, '_id');
      } else if (_.isString(resultSet.results[0])) {
        resultArray = resultSet.results;
      }

      // properly observe the collection!
      if (opts.returnFields) {
        findOptions.fields = EasySearch._transformToFieldSpecifiers(opts.returnFields);
      }

      // see http://stackoverflow.com/questions/3142260/order-of-responses-to-mongodb-in-query
      resultArray = _.map(resultArray, function (id) {
        return { _id: id };
      });     

      if(resultSet.results[0]._score !== undefined){//_score Elasticsearch
        if(findOptions.transform !== undefined){
          var transformInital = findOptions.transform;
          findOptions.transform = function(doc){
            var res = _.findWhere(resultSet.results, {_id: doc._id});
            doc._score = res._score;
            doc = transformInital(doc);
            doc = _.extend(doc,opts.transformResults(doc));
            return doc;
          };
        }else{
          findOptions.transform = function(doc){
            var res = _.findWhere(resultSet.results, {_id: doc._id});
            doc._score = res._score;
            doc = _.extend(doc,opts.transformResults(doc));
            return doc;
          };
        }          
      }
      
      publishHandle = opts.collection
        .find({ $or: resultArray }, findOptions)
        .observe({
          added: function (doc) {
            doc._index = name;
            publishScope.added('esSearchResults', doc._id, doc);
          },
          changed: function (doc) {
            publishScope.changed('esSearchResults', doc._id, doc);
          },
          removed: function (doc) {
            publishScope.removed('esSearchResults', doc._id);
          }
        }
      );

      publishScope.onStop(function () {
        publishHandle.stop();
      });

      publishScope.ready();
    });

    Meteor.publish(name + '/easySearchCount', function () {
      return ESCounts.find({ '_id' : name });
    });
  }

  function extendTransformFunction(collection, originalTransform) {
    return function (doc) {
      var transformedDoc = collection._transform(doc);
      return _.isFunction(originalTransform) ? originalTransform(transformedDoc) : transformedDoc;
    };
  }

  if (Meteor.isClient) {
    /**
     * find method to let users interact with search results.
     *  
     * @param {Object} selector
     * @param {Object} options
     * @returns {MongoCursor}
     */
    defaultOptions.find = function (selector, options) {
      selector = selector || {};
      selector._index = this.name;

      if (this.collection._transform) {
        options.transform = extendTransformFunction(this.collection, options.transform);
      }

      return ESSearchResults.find(selector, options);
    };

    /**
     * findOne method to let users interact with search results.
     *
     * @param {Object} selector
     * @param {Object} options
     * @returns {Document}
     */
    defaultOptions.findOne = function (selector, options) {
      if (_.isObject(selector) || !selector) {
        selector = selector || {};
        selector._index = this.name;
      }

      if (this.collection._transform) {
        options.transform = extendTransformFunction(this.collection, options.transform);
      }

      return ESSearchResults.findOne(selector, options);
    };
  }


  /**
   * Searchers contains all engines that can be used to search content, until now:
   *
   * minimongo (client): Client side collection for reactive search
   * elastic-search (server): Elastic search server to search with (fast)
   * mongo-db (server): MongoDB on the server to search (more convenient)
   *
   */
  Searchers = {};

  return {
    /**
     * Placeholder config method.
     *
     * @param {Object} newConfig
     */
    'config' : function (newConfig) {
      return {};
    },
    /**
     * Simple logging method.
     *
     * @param {String} message
     * @param {String} type
     */
    'log' : function (message, type) {
      type = type || 'log';

      if (console && _.isFunction(console[type])) {
        return console[type](message);
      } else if (console && _.isFunction(console.log)) {
        return console.log(message);
      }
    },
    /**
     * Create a search index.
     *
     * @param {String} name
     * @param {Object} options
     */
    'createSearchIndex' : function (name, options) {
      check(name, Match.OneOf(String, null));
      check(options, Object);

      options.name = name;
      options.field = _.isArray(options.field) ? options.field : [options.field];
      indexes[name] = _.extend(_.clone(defaultOptions), options);

      options = indexes[name];

      if (options.permission) {
        EasySearch.log(
            'permission property is now deprecated! Return false inside a custom query method instead',
            'warn'
        );
      }

      if (Meteor.isServer && EasySearch._usesSubscriptions(name)) {
        setUpPublication(name, indexes[name]);
      }

      Searchers[options.use] && Searchers[options.use].createSearchIndex(name, indexes[name]);
    },
    /**
     * Perform a search.
     *
     * @param {String} name             the search index
     * @param {String} searchString     the string to be searched
     * @param {Object} options          defined with createSearchIndex
     * @param {Function} callback       optional callback to be used
     */
    'search' : function (name, searchString, options, callback) {
      var results,
        index = indexes[name],
        searcherType = index.use;

      check(name, String);
      check(searchString, Object);
      check(options, Object);
      check(callback, Match.Optional(Function));

      if ("undefined" === typeof Searchers[searcherType]) {
        throw new Meteor.Error(500, "Couldnt search with type: '" + searcherType + "'");
      }

      results = Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);

      return index.changeResults(results);
    },
    /**
     * Retrieve a specific index configuration.
     *
     * @param {String} name
     * @return {Object}
     * @api public
     */
    'getIndex' : function (name) {
      return indexes[name];
    },
    /**
     * Retrieve all index configurations
     */
    'getIndexes' : function () {
      return indexes;
    },
    /**
     * Retrieve a specific Seacher.
     *
     * @param {String} name
     * @return {Object}
     * @api public
     */
    'getSearcher' : function (name) {
      return Searchers[name];
    },
    /**
     * Retrieve all Searchers.
     */
    'getSearchers' : function () {
      return Searchers;
    },
    /**
     * Loop through the indexes and provide the configuration.
     *
     * @param {Array|String} indexes
     * @param callback
     */
    'eachIndex' : function (indexes, callback) {
      indexes = !_.isArray(indexes) ? [indexes] : indexes;

      _.each(indexes, function (index) {
        callback(index, EasySearch.getIndex(index));
      });
    },
    /**
     * Makes it possible to override or extend the different
     * types of search to use with EasySearch (the "use" property)
     * when using EasySearch.createSearchIndex()
     *
     * @param {String} key      Type, e.g. mongo-db, elastic-search
     * @param {Object} methods  Methods to be used, only 2 are required:
     *                          - createSearchIndex (name, options)
     *                          - search (name, searchString, [options, callback])
     *                          - defaultQuery (options, searchString)
     *                          - defaultSort (options)
     */
    'createSearcher' : function (key, methods) {
      check(key, String);
      check(methods.search, Function);
      check(methods.createSearchIndex, Function);

      Searchers[key] = methods;
    },
    /**
     * Helper to check if searcher uses server side subscriptions for searching.
     *
     * @param {String} index Index name to check configuration for
     */
    '_usesSubscriptions' : function (index) {
      var conf = EasySearch.getIndex(index);
      return conf && conf.reactive && conf.use !== 'minimongo';
    },
    /**
     * Helper to transform an array of fields to Meteor "Field Specifiers"
     *
     * @param {Array} fields Array of fields
     */
    '_transformToFieldSpecifiers' : function (fields) {
      var specifiers = {};
      
      _.each(fields, function (field) {
        specifiers[field] = 1;
      });

      return specifiers;
    }
  };
})();
