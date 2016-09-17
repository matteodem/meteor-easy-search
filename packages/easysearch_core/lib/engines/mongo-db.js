/**
 * The MongoDBEngine lets you search the index on the server side with MongoDB. Subscriptions and publications
 * are handled within the Engine.
 *
 * @type {MongoDBEngine}
 */
MongoDBEngine = class MongoDBEngine extends ReactiveEngine {
  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    return _.defaults({}, MongoDBEngine.defaultMongoConfiguration(this), super.defaultConfiguration());
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
      aggregation: '$or',
      selector(searchObject, options, aggregation) {
        let selector = {};

        selector[aggregation] = [];

        _.each(searchObject, (searchString, field) => {
          let fieldSelector = engineScope.callConfigMethod(
            'selectorPerField', field, searchString, options
          );

          if (fieldSelector) {
            selector[aggregation].push(fieldSelector);
          }
        });

        return selector;
      },
      selectorPerField(field, searchString) {
        let selector = {};

        selector[field] = { '$regex' : `.*${searchString}.*`, '$options' : 'i'};

        return selector
      },
      sort(searchObject, options) {
        return options.index.fields;
      }
    };
  }

  /**
   * Return the find options for the mongo find query.
   *
   * @param {String} searchDefinition Search definition
   * @param {Object} options          Search and index options
   */
  getFindOptions(searchDefinition, options) {
    return {
      sort: this.callConfigMethod('sort', searchDefinition, options),
      limit: options.search.limit,
      skip: options.search.skip,
      fields: this.callConfigMethod('fields', searchDefinition, options)
    };
  }

  /**
   * Return the reactive search cursor.
   *
   * @param {String} searchDefinition Search definition
   * @param {Object} options          Search and index options
   */
  getSearchCursor(searchDefinition, options) {
    let selector = this.callConfigMethod('selector', searchDefinition, options, this.config.aggregation),
      findOptions = this.getFindOptions(searchDefinition, options),
      collection = options.index.collection;

    check(options, Object);
    check(selector, Object);
    check(findOptions, Object);

    return new Cursor(
      collection.find(selector, findOptions),
      collection.find(selector).count()
    );
  }
};
