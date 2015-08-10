Tinytest.add('EasySearch - Unit - Core - ReactiveEngine', function (test) {
  var CustomReactiveEngine = TestHelpers.createEngine({
      getSearchCursor: function (s, o) {
        test.equal(s, 'testCursor');
        test.equal(o.foo, 'bar');

        return new EasySearch.Cursor(new Mongo.Cursor(), 155);
      }
    }, EasySearch.ReactiveEngine);

  test.throws(function () {
    new EasySearch.ReactiveEngine();
  });

  var engineInstance = new CustomReactiveEngine(),
    indexConfig = { name: 'testIndex' }, calledClientSearch = false;

  engineInstance.onIndexCreate(indexConfig);

  if (Meteor.isClient) {
    var counter = engineInstance.search('test', { index: { searchCollection: { find: function (d, o) {
      test.equal(d, 'test');
      test.equal(o, { limit: 9 });

      return new EasySearch.Cursor(new Mongo.Cursor(), 777);
    } } }, search: { limit: 9 } });

    test.equal(counter.count(), 777);
  } else if (Meteor.isServer) {
    var cursor = engineInstance.search('testCursor', { foo: 'bar' });
    test.instanceOf(cursor, EasySearch.Cursor);
    test.equal(cursor.count(), 155);
  }
});
