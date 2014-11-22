'use strict';

/**
 * Removes all functions from a given configuration.
 *
 * @param {Object} conf
 *
 * @return {Object}
 */
function filterFunctions(conf) {
  return _.omit(conf, 'collection', 'query', 'sort', 'permission');
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

  searcher = EasySearch.getSearcher(index.use);

  // Sanitize the searchString to be really a string
  searchString = searchString || '';

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

  EasySearch.getIndex(name).params[key] = value;
};

/**
 * Allow to change the current set limit value for return search results.
 * @param name
 * @param howMany
 */
EasySearch.changeLimit = function(name, howMany) {
  check(name, String);
  check(howMany, Number);

  EasySearch.getIndex(name).limit = howMany;
};

EasySearch._filterFunctions = filterFunctions;
