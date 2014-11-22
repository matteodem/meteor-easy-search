EasySearch = (function () {
  'use strict';

  var ESCounts,
    Searchers,
    indexes = {/** @see defaultOptions */},
    defaultOptions = {
      'format' : 'mongo',
      'limit' : 10,
      'use' : 'mongo-db',
      'reactive' : true,
      'props' : {},
      'sort' : function () {
        if (Searchers[this.use]) {
          return Searchers[this.use].defaultSort(this);
        }

        return {};
      },
      'permission' : function () {
        return true;
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
       * @return {Object}
       */
      'query' : function (searchString) {
        return Searchers[this.use].defaultQuery(this, searchString);
      }
    };

  ESCounts = new Meteor.Collection('esCounts');

  /** Helper Functions */
  function setUpPublication(opts) {
    var query, name;

    if (!opts.collection) {
      return;
    }

    name = opts.collection._name;

    Meteor.publish(name + '/easySearch', function (conf) {
      var resultArray = [], resultSet;

      if (conf.limit) {
        indexes[name].limit = conf.limit;
      }

      indexes[name].props = _.extend(indexes[name].props, conf.props);

      resultSet = Searchers[opts.use].search(name, conf.value, indexes[name]);

      if (resultSet.results.length > 0) {
        if (_.isObject(resultSet.results[0])) {
          resultArray = _.map(resultSet.results, function (doc) {
            return doc._id;
          });
        } else if (_.isString(resultSet.results[0])) {
          resultArray = resultSet.results;
        }

        query = opts.collection.find({ _id: { $in: resultArray } }, { sort: indexes[name].sort() });
      } else {
        query = [];
      }

      ESCounts.update({ _id: name }, { $set: { count: resultSet.total } }, { upsert: true });

      return query;
    });

    Meteor.publish(name + '/easySearchCount', function () {
      return ESCounts.find({ '_id' : name });
    });
  }

  /**
   * Searchers which contain all engines which can be used to search content, until now:
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
     * @param {object} newConfig
     */
    'config' : function (newConfig) {
      return {};
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

      if (indexes[name].reactive && Meteor.isServer) {
        setUpPublication(indexes[name]);
      }

      Searchers[options.use] && Searchers[options.use].createSearchIndex(name, options);
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
      check(searchString, String);
      check(options, Object);
      check(callback, Match.Optional(Function));

      if ("undefined" === typeof Searchers[searcherType]) {
        throw new Meteor.Error(500, "Couldnt search with the type: '" + searcherType + "'");
      }

      // If custom permission check fails
      if (!index.permission(searchString)) {
        results = { 'results' : [], 'total' : 0 };
      } else {
        results = Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);
      }

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
     * Retrieve all Searchers
     */
    'getSearchers' : function () {
      return Searchers;
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
    }
  };
})();
