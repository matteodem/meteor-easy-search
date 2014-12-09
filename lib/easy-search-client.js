'use strict';

/**
 * Overwrite the Collection.find method to have the reactive search not conflict
 * with other publications defined in the app.
 */

var originalFind = Mongo.Collection.prototype.find;

Mongo.Collection.prototype.find = function (sel, opts) {
  sel = sel || {};
  sel._esSearchResult = { $exists: false };
  return originalFind.apply(this, [sel, opts]);
};

Mongo.Collection.prototype.esFind = function (opts) {
  return originalFind.apply(this, [{ _esSearchResult: true }, opts]);
};

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
 * Allow to change the current set limit value for return search results.
 * @param {String} name
 * @param {Number} howMany
 */
EasySearch.changeLimit = function(name, howMany) {
  check(name, String);
  check(howMany, Number);

  EasySearch.getIndex(name).limit = howMany;
};

EasySearch._filterFunctions = filterFunctions;
