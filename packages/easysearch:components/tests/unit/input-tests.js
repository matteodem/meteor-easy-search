Tinytest.addAsync('EasySearch Components - Unit - Input', function (test, done) {
  var component = TestHelpers.createComponent(EasySearch.InputComponent, {
    attributes: { type: 'number' },
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  test.equal(EasySearch.InputComponent.defaultAttributes, { type: 'text' });
  test.equal(component.inputAttributes(), { type: 'number' });
  test.equal(component.options, { timeout: 20 });
  test.equal(component.dict.get('searchString'), '');
  test.isFalse(component.dict.get('searching'));

  component.debouncedSearch('Peter');
  component.debouncedSearch('Hans');

  test.equal(component.dict.get('searchString'), '');

  Meteor.setTimeout(function () {
    test.equal(component.dict.get('searchString'), 'Hans');
    done();
  }, 100);
});
