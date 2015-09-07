/**
 * The MongoTextIndexEngine lets you search the index with Mongo text indexes.
 *
 * @type {MongoTextIndexEngine}
 */
MongoTextIndexEngine = class MongoTextIndexEngine extends ReactiveEngine {
  /**
   * Constructor
   */
  constructor() {
    let mongoConfiguration = MongoDBEngine.defaultMongoConfiguration(this);

    mongoConfiguration.selector = function (searchString) {
      if (searchString.trim()) {
        return { $text: { $search: searchString } };
      }

      return {};
    };

    this.extendDefaultConfiguration(mongoConfiguration);
    super(...arguments);
  }

  /**
   * Setup the index on creation.
   *
   * @param {Object} indexConfig Index configuration
   */
  onIndexCreate(indexConfig) {
    super.onIndexCreate(indexConfig);

    if (Meteor.isServer) {
      let textIndexesConfig = {};

      _.each(indexConfig.fields, function (field) {
        textIndexesConfig[field] = 'text';
      });

      if (indexConfig.weights) {
        textIndexesConfig.weights = options.weights();
      }

      indexConfig.collection._ensureIndex(textIndexesConfig);
    }
  }
};

// Explicitely inherit getSearchCursor method functionality
MongoTextIndexEngine.prototype.getSearchCursor = MongoDBEngine.prototype.getSearchCursor;
