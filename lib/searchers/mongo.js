'use strict';
var methods = {
  /**
   * Set up a search index.
   *
   * @param name
   * @param options
   * @returns {void}
   */
  'createSearchIndex' : function (name, options) {},
  /**
   *
   * Perform a really simple search with mongo db.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   * @param {Function} callback
   * @returns {Array}
   */
  'search' : function (name, searchString, options, callback) {
    var cursor,
      results,
      selector,
      cursorOptions,
      index = EasySearch.getIndex(name);

    if (!_.isObject(index)) {
      return;
    }

    options.limit = options.limit || 10;

    // if several, fields do an $or search, otherwise only over the field
    selector = index.query(searchString);

    cursorOptions = {
      sort : index.sort(searchString)
    };

    if (options.returnFields) {
      cursorOptions.fields = options.returnFields;
    }

    cursor = index.collection.find(selector, cursorOptions);

    results = {
      'results' : _.first(cursor.fetch(), options.limit),
      'total' : cursor.count()
    };

    if (_.isFunction(callback)) {
      callback(results);
    }

    return results;
  },
  /**
   * The default mongo-db query - selector used for searching.
   *
   * @param {Object} options
   * @param {String} searchString
   * @returns {Object}
   */
  'defaultQuery' : function (options, searchString) {
    var orSelector,
      selector = {},
      field = options.field,
      stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : 'i' };

    if (_.isString(field)) {
      selector[field] = stringSelector;
      return selector;
    }

    // Convert numbers if configured
    if (options.convertNumbers && parseInt(searchString, 10) == searchString) {
      searchString = parseInt(searchString, 10);
    }

    // Should be an array
    selector['$or'] = [];

    _.each(field, function (fieldString) {
      orSelector = {};

      if (_.isString(searchString)) {
        orSelector[fieldString] = stringSelector;
      } else if (_.isNumber(searchString)) {
        orSelector[fieldString] = searchString;
      }

      selector['$or'].push(orSelector);
    });

    return selector;
  },
  /**
   * The default mongo-db sorting method used for sorting the results.
   *
   * @param {Object} options
   * @return array
   */
  'defaultSort' : function (options) {
    return options.field;
  }
};

if (Meteor.isServer) {
  EasySearch.createSearcher('mongo-db', methods);
} else if (Meteor.isClient) {
  EasySearch.createSearcher('minimongo', methods);
}
