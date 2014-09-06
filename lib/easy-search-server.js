'use strict';
var ElasticSearch = Npm.require('elasticsearch');

EasySearch._esDefaultConfig = {
  host : 'localhost:9200'
};

/**
 * Override the config for Elastic Search.
 *
 * @param {object} newConfig
 */
EasySearch.config = function (newConfig) {
  if ("undefined" !== typeof newConfig) {
    check(newConfig, Object);
    this._config = _.extend(this._esDefaultConfig, newConfig);
    this.ElasticSearchClient = new ElasticSearch.Client(this._config);
  }

  return this._config;
};

/**
 * Get the ElasticSearchClient
 * @see http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current
 *
 * @return {ElasticSearch.Client}
 */
EasySearch.getElasticSearchClient = function () {
  return this.ElasticSearchClient;
};

Meteor.methods({
  /**
   * Make server side search possible on the client.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   */
  easySearch: function (name, searchString, options) {
    check(name, String);
    check(searchString, String);
    check(options, Object);
    return EasySearch.search(name, searchString, options);
  }
});
