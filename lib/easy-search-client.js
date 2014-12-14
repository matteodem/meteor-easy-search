'use strict';

/**
 * Create a client only collection that holds all search results.
 */
window.ESSearchResults = new Mongo.Collection('esSearchResults');

/**
 * Removes all functions from a given configuration.
 *
 * @param {Object} conf
 *
 * @return {Object}
 */
function filterFunctions(conf) {
  var key,
    filteredConf = {};

  for (key in conf) if (conf.hasOwnProperty(key) && !_.isFunction(conf[key])) {
    filteredConf[key] = conf[key];
  }

  return _.omit(filteredConf, 'collection');
}

/**
 * Search over one of the defined indexes.
 *
 * @param {String} name
 * @param {String} searchString
 * @param {Function} callback
 * @api public
 */
EasySearch.search = function (name, searchString, callback) {
  var results, searcher,
    index = EasySearch.getIndex(name),
    indexOptions = filterFunctions(index);

  if (!index) {
    throw new Meteor.Error(500, "Couldnt find index: '" + name + "'");
  }

  searchString = searchString || '';
  searcher = EasySearch.getSearcher(index.use);

  if (searcher) {
    results = searcher.search(name, searchString, indexOptions);
    callback(null, index.changeResults(results));
  } else {
    Meteor.call('easySearch', name, searchString, indexOptions, callback);
  }
};

/**
 * Search over multiple indexes.
 *
 * @param {Array} indexes
 * @param {String} searchString
 * @param {Function} callback
 * @api public
 */
EasySearch.searchMultiple = function (indexes, searchString, callback) {
  var easySearchScope = this;

  _.each(indexes, function (name) {
    easySearchScope.search(name, searchString, callback);
  });
};

/**
 * Allow easily changing custom properties.
 * Useful for faceted search.
 *
 * @param {String} name
 * @param {String} key
 * @param {Object} value
 * @api public
 */
EasySearch.changeProperty = function(name, key, value) {
  check(name, String);
  check(key, String);

  EasySearch.getIndex(name).props[key] = value;
};

/**
 * Allow to change the current set limit value for the size of search results.
 * @param {String} name
 * @param {Number} howMany
 */
EasySearch.changeLimit = function(name, howMany) {
  check(name, String);
  check(howMany, Number);

  EasySearch.getIndex(name).limit = howMany;
};

/**
 * Allow to change the current skip value for pagination.
 * @param {String} name
 * @param {Number|String} step
 */
EasySearch.pagination = function(name, step) {
  var skip;

  check(name, String);
  check(step, Match.OneOf(Number, String));

  var conf = EasySearch.getIndex(name);

  if (EasySearch.PAGINATION_PREV === step) {
    skip  = conf.skip - conf.limit;
  } else if (EasySearch.PAGINATION_NEXT === step) {
    skip = conf.skip + conf.limit;
  } else {
    skip = (step - 1) * conf.limit;
  }

  EasySearch.getIndex(name).skip = skip;

  return { skip: skip, limit: conf.limit };
};


// Globals
EasySearch.PAGINATION_PREV = 'prev';
EasySearch.PAGINATION_NEXT = 'next';

EasySearch._filterFunctions = filterFunctions;
