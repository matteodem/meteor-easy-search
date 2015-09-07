Tinytest.add('EasySearch Components - Unit - Each', function (test) {
  var component = TestHelpers.createComponent(EasySearch.EachComponent, {
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  _.first(component.indexes).search = function (searchString) {
    test.equal(searchString, 'hans');
    return new EasySearch.Cursor({
      fetch: function () { return [{ foo: 'bar' }]; },
      count: function () { return 10; }
    }, 200);
  };

  _.first(component.dicts).set('searchString', 'hans');

  var cursor = component.doc();

  test.equal(_.first(component.dicts).get('count'), 200);
  test.equal(_.first(component.dicts).get('currentCount'), 10);
  test.equal(_.first(component.dicts).get('searching'), false);
  test.equal(cursor.fetch(), [{ foo: 'bar' }]);

  test.throws(function () {
    TestHelpers.createComponent(EasySearch.EachComponent, {
      indexes: [new EasySearch.Index({
        collection: new Meteor.Collection(null),
        engine: new EasySearch.Minimongo(),
        fields: ['test']
      })]
    });
  }());
});
