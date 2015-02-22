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