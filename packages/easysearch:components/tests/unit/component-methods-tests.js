Tinytest.add('EasySearch Components - Unit - Component Methods - addProps / removeProps', function (test) {
  let index = new EasySearch.Index({
    collection: new Meteor.Collection('setPropsCollection'),
    engine: new EasySearch.Minimongo(),
    fields: ['test']
  });

  index.registerComponent();

  let componentMethods = index.getComponentMethods();

  componentMethods.addProps('customProp', 'customValue');

  test.equal(index.getComponentDict().get('searchOptions'), {
    props: {
      customProp: 'customValue'
    }
  });

  componentMethods.addProps({
    what: 'test',
    aha: 'yeah'
  });

  test.equal(index.getComponentDict().get('searchOptions'), {
    props: {
      what: 'test',
      aha: 'yeah',
      customProp: 'customValue'
    }
  });

  componentMethods.addProps({
    aha: 'yeah new',
    anArray: ['i', 'am', 'complex']
  });

  test.equal(index.getComponentDict().get('searchOptions').props.aha, 'yeah new');
  test.equal(index.getComponentDict().get('searchOptions').props.anArray, ['i', 'am', 'complex']);

  componentMethods.removeProps('aha', 'customProp', 'anArray');

  test.equal(index.getComponentDict().get('searchOptions'), {
    props: {
      what: 'test'
    }
  });

  componentMethods.removeProps();

  test.equal(index.getComponentDict().get('searchOptions'), {
    props: {}
  });
});
