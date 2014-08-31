/**
 * @title EasySearch Client Methods
 * @overview These are all the methods exposed to the client.
 * @author Matteo De Micheli
 * @license MIT
 *
 * @module EasySearch
 */

EasySearch = (function () {
  'use strict';

  var defaults = {
      limit: 10
    },
    indexes = {};

  /**
   * Removes all functions from a given configuration.
   *
   * @param {Array} conf
   *
   * @return {Array}
   */
  function filterFunctions(conf) {
    return _.omit(conf, 'collection', 'query', 'sort', 'permission');
  }

  return {
    /**
     * Create a search "index" to search on.
     *
     * @param {String} name
     * @param {Object} options
     */
    'createSearchIndex' : function (name, options) {
      check(name, String);
      check(options, Object);

      options.field = _.isArray(options.field) ? options.field : [options.field];
      indexes[name] = _.extend(_.clone(defaults), options);
      indexes[name].defaultLimit = options.limit;
    },
    /**
     * Search over one of the defined indexes.
     *
     * @param {String} name
     * @param {String} searchString
     * @param {Function} callback
     * @api public
     */
    'search' : function (name, searchString, callback) {
      Meteor.call('easySearch', name, searchString, filterFunctions(indexes[name]), callback);
    },
    /**
     * Search over multiple indexes.
     *
     * @param {Array} indexes
     * @param {String} searchString
     * @param {Function} callback
     * @api public
     */
    'searchMultiple' : function (indexes, searchString, callback) {
      _.each(indexes, function (name) {
        Meteor.call('easySearch', name, searchString, filterFunctions(indexes[name]), callback);
      });
    },
    /**
     * Allow easily changing properties (for example the global search fields).
     *
     * @param {String} name
     * @param {String} key
     * @param {Object} value
     * @api public
     */
    'changeProperty' : function(name, key, value) {
      check(name, String);
      check(key, String);

      indexes[name][key] = value;
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
     *
     * @return {Array}
     * @api public
     */
    'getIndexes' : function () {
      return indexes;
    }
  };
})();
