/**
 * The MongoDBEngine lets you search the index on the server side with MongoDB. Subscriptions and publications
 * are handled within the Engine.
 *
 * @type {MongoDBEngine}
 */
MongoDBEngine = class MongoDBEngine extends ReactiveEngine {
  /**
   * Constructor.
   */
  constructor() {
    this.extendDefaultConfiguration(MongoDBEngine.defaultMongoConfiguration(this));

    super(...arguments);
  }

  /**
   * Default mongo configuration, used in constructor and MinimongoEngine to get the configuration.
   *
   * @param {Object} engineScope Scope of the engine
   *
   * @returns {Object}
   */
  static defaultMongoConfiguration(engineScope) {
    return {
      selector: function (searchString, options) {
        let selector = {
          $or: []
        };

        _.each(options.index.fields, function (field) {
          selector['$or'].push(engineScope.callConfigMethod('selectorPerField', field, searchString));
        });

        return selector;
      },
      selectorPerField: function (field, searchString) {
        let selector = {};

        selector[field] = { '$regex' : `.*${searchString}.*`, '$options' : 'i'};

        return selector
      },
      sort: function (searchString, options) {
        return options.index.fields;
      }
    };
  }

  /**
   * Return the reactive search cursor.
   *
   * @param {String} searchString String to search for
   * @param {Object} options      Search and index options
   */
  getSearchCursor(searchString, options) {
    let selector = this.callConfigMethod('selector', searchString, options),
      collection = options.index.collection,
      findOptions = {
        sort: this.callConfigMethod('sort', searchString, options),
        limit: options.search.limit,
        offset: options.search.offset
      };

    check(searchString, String);
    check(options, Object);

    return new Cursor(
      collection.find(selector, findOptions),
      collection.find(selector).count()
    );
  }
};
