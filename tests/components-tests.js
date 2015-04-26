Tinytest.add('EasySearch - Components - esInput', function (test) {
  var func = Template.esInput.__helpers.get('type');

  test.equal(func.apply({
    type: 'number'
  }), 'number');

  test.equal(func.apply({}), 'text');

  test.equal(func.apply({
    type: 'custom'
  }), 'custom');
});

Tinytest.add('EasySearch - Components - ifEsIsSearching', function (test) {
  var func = Template.ifEsIsSearching.__helpers.get('isSearching');

  Session.set('esVariables_notSearchingIndex_searching', false);
  Session.set('esVariables_searchingIndex_search_searching', true);

  test.equal(func.apply({
    index: 'notSearchingIndex'
  }), false);

  test.equal(func.apply({
    index: 'searchingIndex',
    id: 'search'
  }), true);
});

Tinytest.add('EasySearch - Components - ifEsHasNoResults', function (test) {
  var func = Template.ifEsHasNoResults.__helpers.get('hasNoResults'),
    defaultValues = [{ _id: '111' }];

  Session.set('esVariables_resultsIndex_searchResults', defaultValues);
  Session.set('esVariables_resultsIndex_currentValue', 'test search');
  
  Session.set('esVariables_resultsIndex_searching', true);
  
  test.equal(func.apply({
    index: 'resultsIndex'
  }), false);

  Session.set('esVariables_resultsIndex_searchResults', defaultValues);
  Session.set('esVariables_resultsIndex_currentValue', '');

  test.equal(func.apply({
    index: 'resultsIndex'
  }), false);

  Session.set('esVariables_resultsIndex_searchResults', 'notValid');

  test.equal(func.apply({
    index: 'resultsIndex'
  }), false);

  Session.set('esVariables_resultsIndex_searching', false);
  Session.set('esVariables_resultsIndex_currentValue', 'not empty');
  Session.set('esVariables_resultsIndex_searchResults', []);

  test.equal(func.apply({
    index: 'resultsIndex'
  }), true);
});

Tinytest.add('EasySearch - Components - ifEsInputIsEmpty', function (test) {
  var func = Template.ifEsInputIsEmpty.__helpers.get('inputIsEmpty');

  Session.set('esVariables_inputIndex_currentValue', '');

  test.equal(func.apply({
    index: 'inputIndex'
  }), true);

  Session.set('esVariables_inputIndex_currentValue', null);

  test.equal(func.apply({
    index: 'inputIndex'
  }), true);

  Session.set('esVariables_inputIndex_currentValue', 'not empty');

  test.equal(func.apply({
    index: 'inputIndex'
  }), false);
});

Tinytest.add('EasySearch - Components - esEach', function (test) {
  var func = Template.esEach.__helpers.get('elasticSearchDoc'),
    originalUsesSubscriptions = EasySearch._usesSubscriptions,
    originalGetIndex = EasySearch.getIndex,
    searchResults = [
      { _id: 'wow', name: 'super' },
      { _id: 'wow2', name: 'super2' }
    ];

  Session.set('esVariables_eachIndex_searchResults', false);

  test.equal(func.apply({
    index: 'eachIndex'
  }), []);

  Session.set('esVariables_eachIndex_searchResults', []);

  test.equal(func.apply({
    index: 'eachIndex'
  }), []);

  Session.set('esVariables_eachIndex_searchResults', searchResults);

  Session.set('esVariables_eachIndex_searching', true);

  test.equal(func.apply({
    index: 'eachIndex'
  }), []);

  Session.set('esVariables_eachIndex_searching', false);

  test.equal(func.apply({
    index: 'eachIndex'
  }), searchResults);

  EasySearch._usesSubscriptions = function () {
    return true;
  };

  EasySearch.getIndex = function () {
    return {
      find: function () {
        return { fake: 'cursor' };
      },
      reactiveSort: function () {
        return { sort: ['_id'] };
      }
    }
  };
  
  test.equal(func.apply({
    index: 'eachIndex'
  }), { fake: 'cursor' });

  EasySearch._usesSubscriptions = originalUsesSubscriptions;
  EasySearch.getIndex = originalGetIndex;
});
