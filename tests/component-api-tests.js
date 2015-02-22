var fakeConf = { 'index' : 'fakeIndex' };

Tinytest.add('EasySearch - Component Api - generateId', function (test) {
  var conf = { 'index' : 'players'},
    confWithId = { id : 'mainsearch', 'index' : 'players' }
  ;

  test.equal(EasySearch.getComponentInstance(conf).generateId(), 'players');
  test.equal(EasySearch.getComponentInstance(confWithId).generateId(), 'players_mainsearch');
  test.throws(function () { EasySearch.getComponentInstance({}).generateId() });
  test.throws(function () { EasySearch.getComponentInstance().generateId() });
});

Tinytest.add('EasySearch - Component Api - get', function (test) {
  Session.set('esVariables_fakeIndex_searching', false);
  Session.set('esVariables_fakeIndex_searchingDone', true);
  Session.set('esVariables_fakeIndex_currentValue', 'how do I do this');
  Session.set('esVariables_fakeIndex_randomProperty', 'random value');

  test.equal(EasySearch.getComponentInstance(fakeConf).get('searching'), false);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('searchingDone'), true);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('currentValue'), 'how do I do this');
  test.equal(EasySearch.getComponentInstance(fakeConf).get('randomProperty'), 'random value');
});

Tinytest.add('EasySearch - Component Api - clear', function (test) {
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

Tinytest.add('EasySearch - Component Api - paginate', function (test) {
  var originalGetIndex = EasySearch.getIndex;

  Session.set('esVariables_fakeIndex_paginationSkip', -1);
  Session.set('esVariables_fakeIndex_currentControl', -1);

  EasySearch.getIndex = function () {
    return { reactive: false, limit: 20, name: 'fakeIndex' };
  };

  EasySearch.getComponentInstance(fakeConf).paginate(1);

  test.equal(EasySearch.getComponentInstance(fakeConf).get('paginationSkip'), 0);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('currentControl'), 1);
  
  EasySearch.getComponentInstance(fakeConf).paginate(2);

  test.equal(EasySearch.getComponentInstance(fakeConf).get('paginationSkip'), 20);
  test.equal(EasySearch.getComponentInstance(fakeConf).get('currentControl'), 2);
  
  EasySearch.getIndex = originalGetIndex;
});

Tinytest.addAsync('EasySearch - Component Api - search', function (test, done) {
  var originalGetIndex = EasySearch.getIndex,
    originalSearch = EasySearch.search,
    instance = EasySearch.getComponentInstance(fakeConf);

  EasySearch.getIndex = function () {
    return { reactive: false };
  };

  EasySearch.search = function (index, searchValue, cb) {};

  Session.set('esVariables_fakeIndex_searching', true);
  Session.set('esVariables_fakeIndex_searchingDone', true);
  Session.set('esVariables_fakeIndex_currentValue', 'notSomething');

  instance.search('something');

  test.equal(instance.get('currentValue'), 'something');

  instance.search('');

  test.equal(instance.get('searching'), false);
  test.equal(instance.get('searchingDone'), false);
  
  setTimeout(function () {
    EasySearch.getIndex = originalGetIndex;
    EasySearch.search = originalSearch;
    
    done();
  }, 100);
});

Tinytest.addAsync('EasySearch - Component Api - triggerSearch (not reactive)', function (test, done) {
  var originalGetIndex = EasySearch.getIndex,
    originalSearch = EasySearch.search,
    instance = EasySearch.getComponentInstance(fakeConf);

  EasySearch.getIndex = function () {
    return { reactive: false };
  };

  EasySearch.search = function (index, searchValue, cb) {
    var results = [{ _id: 10, value: 100 }, { _id: 2, value: 200 }];

    test.equal(index, 'fakeIndex');
    test.equal(searchValue, 'something');

    cb(null, {
      total: results.length,
      results: results
    });

    test.equal(instance.get('searching'), false);
    test.equal(instance.get('total'), results.length);
    test.equal(instance.get('searchingDone'), true);
    test.equal(instance.get('searchResults'), results);

    EasySearch.getIndex = originalGetIndex;
    EasySearch.search = originalSearch;

    done();
  };

  Session.set('esVariables_fakeIndex_currentValue', 'something');
  instance.triggerSearch();
});

Tinytest.addAsync('EasySearch - Component Api - triggerSearch (reactive)', function (test, done) {
  var originalGetIndex = EasySearch.getIndex,
    originalSubscribe = Meteor.subscribe,
    instance = EasySearch.getComponentInstance(fakeConf);
  
  EasySearch.getIndex = function () {
    return { name: 'fakeIndex', reactive: true, use: 'mongo-db' };
  };

  Meteor.subscribe = function (subscriptionName, config, cb) {
    test.equal(subscriptionName, 'fakeIndex/easySearch');

    test.instanceOf(config, Object);
    
    cb();

    test.equal(instance.get('searching'), false);
    test.equal(instance.get('searchingDone'), true);

    EasySearch.getIndex = originalGetIndex;
    Meteor.subscribe = originalSubscribe;

    done();
  };

  instance.triggerSearch();
});

// Autosuggest

Tinytest.add('EasySearch - Component Api - resetAutosuggest', function (test) {
  var instance = EasySearch.getComponentInstance(fakeConf),
    called = false;

  Session.set('esVariables_fakeIndex_autosuggestSelected', [{ id: 'testId', value: 'testValue' }]);

  instance.clear = function () {
    called = true;
  };

  instance.resetAutosuggest({
    val: function (emptyString) {
      test.equal(emptyString, '');
    }
  });

  test.equal(called, true);
  test.equal(instance.get('autosuggestSelected'), []);
});

Tinytest.add('EasySearch - Component Api - manageAutosuggestValues', function (test) {
  var instance = EasySearch.getComponentInstance(fakeConf),
    beforeValues = [{ id: 'testId', value: 'testValue'}],
    afterValues = [{ id: 'testId2', value: 'testValue2'}],
    called = false;

  Session.set('esVariables_fakeIndex_autosuggestSelected', beforeValues);

  test.throws(function () {
    instance.manageAutosuggestValues()
  });

  test.equal(instance.get('autosuggestSelected'), beforeValues);

  test.throws(function () {
    instance.manageAutosuggestValues(function (current) {
      return { invalid: 'format' };
    });
  });

  test.equal(instance.get('autosuggestSelected'), beforeValues);
  
  instance.manageAutosuggestValues(function (current) {
    called = true;
    return afterValues;
  });

  test.equal(called, true);
  test.equal(instance.get('autosuggestSelected'), afterValues);
});

Tinytest.add('EasySearch - Component Api - mapIndexesWithLogic', function (test) {
  var simpleConf = { index: 'testIndex' },
    confWithLogic = { index: 'testIndex2', logic: 'OR' },
    confWithInvalidLogic = { index: 'testIndex2', logic: 'WHAT'};

  test.isTrue(EasySearch._mapIndexesWithLogic(simpleConf, function (index) {
    return index === simpleConf.index;
  }));

  test.isTrue(EasySearch._mapIndexesWithLogic(confWithLogic, function (index) {
    return index === confWithLogic.index;
  }));

  test.isFalse(EasySearch._mapIndexesWithLogic(confWithInvalidLogic, function (index) {
    return index === simpleConf.index;
  }));
});
