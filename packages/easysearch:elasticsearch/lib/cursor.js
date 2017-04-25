import { Cursor } from 'meteor/easysearch:core';

/**
 * A Cursor that extends the regular EasySearch cursor. This cursor is Elasticsearch specific.
 *
 * @type {ESCursor}
 */
class ESCursor extends Cursor {
  /**
   * Constructor
   *
   * @param {Mongo.Cursor}  hitsCursor      Referenced mongo cursor to the regular hits field
   * @param {Number}        count           Count of all documents found in regular hits field
   * @param {Object}        aggs            Raw aggragtion data
   * @param {Boolean}       isReady         Cursor is ready
   * @param {Object}        publishHandle   Publish handle to stop if on client
   *
   * @constructor
   *
   */
  constructor(cursor, count, isReady = true, publishHandle = null, aggs = {}) {
    check(cursor.fetch, Function);
    check(count, Number);
    check(aggs, Match.Optional(Object));

    super(cursor, count, isReady, publishHandle);

    this._aggs = aggs;
  }

  getAggregation(path) {
    return this._aggs[path];
  }

  getAggregations() {
    return this._aggs;
  }
}

export default ESCursor;
