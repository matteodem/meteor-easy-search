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

  test.equal(EasySearch.getComponentInstance(fakeConf).get('searching'), false);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('searchingDone'), true);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('currentValue'), 'how do I do this');
});

Tinytest.addAsync('EasySearch - Components - on', function (test, completed) {
  var values = ['how do I do this again', 'how do I write a test?'];

  Session.set('esVariables_fakeIndex_currentValue', 'how do I do this again');

  EasySearch.getComponentInstance(fakeConf).on('currentValue', function (val) {
    test.equal(val, values.shift());

    if (values.length === 0) {
      completed();
    }
  });

  Session.set('esVariables_fakeIndex_currentValue', 'how do I write a test?');
});
