/**
 * The MinimongEngine lets you search the index on the client-side.
 *
 * @type {MinimongoEngine}
 */
MinimongoEngine = class MinimongoEngine extends Engine {
  /**
   * Constructor
   */
  constructor() {
    this.extendDefaultConfiguration(MongoDBEngine.defaultMongoConfiguration(this));

    super(...arguments);
  }

  /**
   * Search the index.
   *
   * @param {String} searchString String to search for
   * @param {Object} options      Object of options
   *
   * @returns {cursor}
   */
  search(searchString, options) {
    if (!Meteor.isClient) {
      throw new Meteor.Error('only-client', 'Minimongo can only be used on the client');
    }

    // check() calls are in getSearchCursor method
    return MongoDBEngine.prototype.getSearchCursor.apply(this, arguments);
  }
};
