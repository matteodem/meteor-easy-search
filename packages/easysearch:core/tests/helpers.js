TestHelpers = {
  createEngine: function (methods, engineClass, defaultConfiguration) {
    if (!engineClass) {
      engineClass = EasySearch.Engine;
    }

    if (!defaultConfiguration) {
      defaultConfiguration = {};
    }

    var engine = function () {
      this.extendDefaultConfiguration(defaultConfiguration);
      engineClass.apply(this, arguments);
    };

    engine.prototype = _.extend(Object.create(engineClass.prototype), methods);

    engine.prototype.constructor = engine;

    return engine;
  },
  createIndex: function () {
    return new EasySearch.Index({
      collection: new Meteor.Collection(null),
      fields: ['testField'],
      engine: new (TestHelpers.createEngine({ search: function () {} }))()
    });
  }
};
