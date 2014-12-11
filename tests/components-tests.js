var fakeConf = { 'index' : 'fakeIndex' };

Tinytest.add('EasySearch - Components - generateId', function (test) {
  var conf = { 'index' : 'players'},
    confWithId = { id : 'mainsearch', 'index' : 'players' }
  ;

  test.equal(EasySearch.getComponentInstance(conf).generateId(), 'players');
  test.equal(EasySearch.getComponentInstance(confWithId).generateId(), 'players_mainsearch');
  test.throws(function () { EasySearch.getComponentInstance({}).generateId() });
  test.throws(function () { EasySearch.getComponentInstance().generateId() });
});

Tinytest.add('EasySearch - Components - get', function (test) {
  Session.set('esVariables_fakeIndex_searching', false);
  Session.set('esVariables_fakeIndex_searchingDone', true);
  Session.set('esVariables_fakeIndex_currentValue', 'how do I do this');
  Session.set('esVariables_fakeIndex_randomProperty', 'random value');

  test.equal(EasySearch.getComponentInstance(fakeConf).get('searching'), false);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('searchingDone'), true);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('currentValue'), 'how do I do this');
  test.equal(EasySearch.getComponentInstance(fakeConf).get('randomProperty'), 'random value');
});

Tinytest.add('EasySearch - Components - clear', function (test) {
  Session.set('esVariables_fakeIndex_searching', true);
  Session.set('esVariables_fakeIndex_searchingDone', true);
  Session.set('esVariables_fakeIndex_total', 200);
  Session.set('esVariables_fakeIndex_currentValue', 'beer');
  Session.set('esVariables_fakeIndex_searchResults', [{}, {}, {}]);

  var instance = EasySearch.getComponentInstance(fakeConf);

  instance.clear();

  test.equal(instance.get('searching'), false);
  test.equal(instance.get('searchingDone'), false);
  test.equal(instance.get('total'), 0);
  test.equal(instance.get('currentValue'), '');
  test.equal(instance.get('searchResults'), []);
});

Tinytest.add('EasySearch - Components - filterFunctions', function (test) {
  var filteredConf = EasySearch._filterFunctions({
    'func1' : function () {},
    'awesomeNumber' : 10,
    'awesomeString' : 'test',
    'awesomeObject' : {},
    'func2' : function () {},
    'awesomeArray': ['a', 'b'],
    'awesomeBoolean' : true
  });

  test.isUndefined(filteredConf.func1);
  test.isUndefined(filteredConf.func2);
  test.equal(filteredConf.awesomeNumber, 10);
  test.equal(filteredConf.awesomeString, 'test');
  test.equal(filteredConf.awesomeObject, {});
  test.equal(filteredConf.awesomeArray, ['a', 'b']);
  test.equal(filteredConf.awesomeBoolean, true);
});

