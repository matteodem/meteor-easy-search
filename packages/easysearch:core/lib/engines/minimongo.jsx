MinimongoEngine = class MinimongoEngine extends Engine {

  constructor() {
    this.extendDefaultConfiguration(MongoDBEngine.defaultMongoConfiguration(this));

    super(...arguments);
  }

  search(searchString, options) {
    if (!Meteor.isClient) {
      throw new Meteor.Error('only-client', 'Minimongo can only be used on the client');
    }

    return MongoDBEngine.prototype.getSearchCursor.apply(this, arguments);
  }
};
