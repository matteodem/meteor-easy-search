MongoDBEngine = class MongoDBEngine extends ReactiveEngine {

  constructor() {
    this.extendDefaultConfiguration(MongoDBEngine.defaultMongoConfiguration(this));

    super(...arguments);
  }

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

  getSearchCursor(searchString, options) {
    let selector = this.callConfigMethod('selector', searchString, options),
      collection = options.index.collection,
      findOptions = {
        sort: this.callConfigMethod('sort', searchString, options),
        limit: options.search.limit,
        offset: options.search.offset
      };

    return new Cursor(
      collection.find(selector, findOptions),
      collection.find(selector).count()
    );
  }
};
