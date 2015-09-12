Tinytest.addAsync('EasySearch - Unit - Core - Index', function (test, done) {
  var index = TestHelpers.createIndex();

  test.throws(function () {
    new EasySearch.Index();
  });

  test.throws(function () {
    index.search();
  });

  test.throws(function () {
    index.search(true);
  });

  index.config.engine.search = function (searchDefinition, options) {
    test.equal(searchDefinition, 'testSearch');
    test.equal(options.search, { limit: 200, skip: 20 });
  };

  index.search('testSearch', { limit: 200, skip: 20 });

  index.config.engine.search = function (searchDefinition, options) {
    test.equal(searchDefinition, { name: 'test', country: 'CH' });
    test.equal(options.search, { limit: 10, skip: 0 });
    done();
  };

  index.search({ name: 'test', country: 'CH' });
});

Tinytest.add('EasySearch - Unit - Core - Index - default configuration', function (test) {
  test.equal(EasySearch.Index.defaultConfiguration.permission(), true);
});
