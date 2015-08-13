Tinytest.add('EasySearch Components - Unit - IfInputEmpty', function (test) {
  var component = TestHelpers.createComponent(EasySearch.IfInputEmptyComponent, {
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  component.dict.set('searchString', null);
  test.isTrue(component.inputEmpty());

  component.dict.set('searchString', '');
  test.isTrue(component.inputEmpty());

  component.dict.set('searchString', '   ');
  test.isTrue(component.inputEmpty());

  component.dict.set('searchString', 'test');
  test.isFalse(component.inputEmpty());
});

Tinytest.add('EasySearch Components - Unit - IfNoResults', function (test) {
  var component = TestHelpers.createComponent(EasySearch.IfNoResultsComponent, {
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  component.dict.set('count', null);
  test.isTrue(component.noResults());

  component.dict.set('count', 0);
  test.isTrue(component.noResults());

  component.dict.set('count', 1);
  test.isFalse(component.noResults());

  component.dict.set('count', 120);
  test.isFalse(component.noResults());
});

Tinytest.add('EasySearch Components - Unit - IfSearching', function (test) {
  var component = TestHelpers.createComponent(EasySearch.IfSearchingComponent, {
    index: new EasySearch.Index({
      collection: new Meteor.Collection(null),
      engine: new EasySearch.Minimongo(),
      fields: ['test']
    })
  });

  component.onCreated();

  component.dict.set('searching', true);
  test.isTrue(component.searching());

  component.dict.set('searching', false);
  test.isFalse(component.searching());
});
