/**
 * A ReactiveEngine handles the reactive logic, such as subscribing
 * and publishing documents into a self contained collection.
 *
 * @type {ReactiveEngine}
 */
ReactiveEngine = class ReactiveEngine extends Engine {
  /**
   * Constructor.
   *
   * @param {Object} config Configuration
   *
   * @constructor
   */
  constructor(config) {
    if (this === this.constructor) {
      throw new Error('Cannot initialize instance of ReactiveEngine');
    }

    if (!_.isFunction(this.getSearchCursor)) {
      throw new Error('Reactive engine needs to implement getSearchCursor method');
    }

    this.extendDefaultConfiguration({
      transform: (doc) => doc,
      beforePublish: (event, doc) => doc
    });

    super(config);
  }

  /**
   * Create a search collection used for reactive searching when index is created.
   *
   * @param {Object} indexConfig Index configuration
   */
  onIndexCreate(indexConfig) {
    super.onIndexCreate(indexConfig);
    indexConfig.searchCollection = new SearchCollection(indexConfig, this);
    indexConfig.mongoCollection = indexConfig.searchCollection._collection;
  }

  /**
   * Reactively search on the collection.
   *
   * @param {String} searchString Search string
   * @param {Object} options      Options
   *
   * @returns {Cursor}
   */
  search(searchString, options) {
    if (Meteor.isClient) {
      return options.index.searchCollection.find(searchString, options.search);
    } else {
      return this.getSearchCursor(searchString, options);
    }
  }
};
