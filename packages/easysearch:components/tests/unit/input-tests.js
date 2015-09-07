Tinytest.addAsync('EasySearch Components - Unit - Input', function (test, done) {
  var component = TestHelpers.createComponent(EasySearch.InputComponent, {
    attributes: { type: 'number' },
    indexes: [new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })]
  });

  component.onCreated();

  test.equal(EasySearch.InputComponent.defaultAttributes, { type: 'text' });
  test.equal(component.inputAttributes(), { type: 'number' });
  test.equal(component.options, { timeout: 50 });
  test.equal(_.first(component.dicts).get('searchString'), '');
  test.isFalse(_.first(component.dicts).get('searching'));

  component.debouncedSearch('Peter');
  component.debouncedSearch('Hans');

  test.equal(_.first(component.dicts).get('searchString'), '');

  Meteor.setTimeout(function () {
    test.equal(_.first(component.dicts).get('searchString'), 'Hans');
    done();
  }, 100);
});
