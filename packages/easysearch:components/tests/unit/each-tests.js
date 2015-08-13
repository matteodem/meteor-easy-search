Tinytest.add('EasySearch Components - Unit - Each', function (test) {
  var component = TestHelpers.createComponent(EasySearch.EachComponent, {
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  component.index.search = function (searchString) {
    test.equal(searchString, 'hans');
    return new EasySearch.Cursor({
      fetch: function () { return [{ foo: 'bar' }]; }
    }, 200);
  };

  component.dict.set('searchString', 'hans');

  var cursor = component.doc();

  test.equal(component.dict.get('count'), 200);
  test.equal(component.dict.get('searching'), false);
  test.equal(cursor.fetch(), [{ foo: 'bar' }]);
});
