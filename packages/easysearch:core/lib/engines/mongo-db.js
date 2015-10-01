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
      selector(searchObject, options) {
        let selector = {
          $or: []
        };

        _.each(searchObject, function (searchString, field) {
          selector['$or'].push(engineScope.callConfigMethod(
            'selectorPerField', field, searchString, options
          ));
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
   * Return the reactive search cursor.
   *
   * @param {String} searchDefinition Search definition
   * @param {Object} options          Search and index options
   */
  getSearchCursor(searchDefinition, options) {
    searchDefinition = this.transformSearchDefinition(searchDefinition, options);

    let selector = this.callConfigMethod('selector', searchDefinition, options),
      collection = options.index.collection,
      findOptions = {
        sort: this.callConfigMethod('sort', searchDefinition, options),
        limit: options.search.limit,
        skip: options.search.skip,
        fields: this.callConfigMethod('fields', searchDefinition, options)
      };

    check(searchDefinition, Object);
    check(options, Object);

    return new Cursor(
      collection.find(selector, findOptions),
      collection.find(selector).count()
    );
  }

  /**
   * Transform the search definition.
   *
   * @param {String|Object} searchDefinition Search definition
   * @param {Object}        options          Search and index options
   *
   * @returns {Object}
   */
  transformSearchDefinition(searchDefinition, options) {
    if (_.isString(searchDefinition)) {
      let obj = {};

      _.each(options.index.fields, function (field) {
        obj[field] = searchDefinition;
      });

      searchDefinition = obj;
    }
    return searchDefinition;
  }

  /**
   * Check the given search parameter for validity
   *
   * @param search
   * @param indexOptions
   */
  checkSearchParam(search, indexOptions) {
    check(search, Match.OneOf(String, Object));

    if (_.isObject(search)) {
      _.each(search, function (val, field) {
        check(val, String);

        if (-1 === _.indexOf(indexOptions.allowedFields, field)) {
          throw new Meteor.Error(`Not allowed to search over field "${field}`);
        }
      });
    }
  }
};
