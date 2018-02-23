import { SearchCollection } from 'meteor/easysearch:core';
import ESCursor from './cursor';

/**
 * A search collection represents a reactive collection on the client,
 * which is used by the ReactiveEngine for searching using Elasticsearch.
 *
 * @type {ESSearchCollection}
 */
class ESSearchCollection extends SearchCollection {
  /**
   * Constructor
   *
   * @param {Object}         indexConfiguration Index configuration
   * @param {ReactiveEngine} engine             Reactive Engine
   *
   * @constructor
   */
  constructor() {
    super(...arguments, false);
  }

  /**
   * Find documents on the client.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Options
   *
   * @returns {ESCursor}
   */
  find(searchDefinition, options) {
    if (!Meteor.isClient) {
      throw new Error('find can only be used on client');
    }

    let publishHandle = Meteor.subscribe(this.name, searchDefinition, options);

    let count = this._getCount(searchDefinition);
    let aggs = this._getAggregation(searchDefinition);
    let mongoCursor = this._getMongoCursor(searchDefinition, options);

    if (!_.isNumber(count)) {
      return new ESCursor(mongoCursor, 0, false, null, aggs);
    }

    return new ESCursor(mongoCursor, count, true, publishHandle, aggs);
  }

  /**
   * Get the aggregations linked to the search
   *
   * @params {Object} searchDefinition Search definition
   *
   * @private
   */
  _getAggregation(searchDefinition) {
    const aggsDoc = this._collection.findOne('aggs' + JSON.stringify(searchDefinition));
    if (aggsDoc) {
      return aggsDoc.aggs;
    }
    return {};
  }

}

export default ESSearchCollection;
