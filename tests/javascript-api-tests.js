var collection1 = new Meteor.Collection('estestCollection');

collection1.allow({
  'insert' : function () { return true; },
  'remove' : function () { return true; }
});

if (Meteor.isServer) {
  collection1.remove({ });

  // fixture data
  collection1.insert({ 'name' : 'Super Pomodoro' });
  collection1.insert({ 'name' : 'Awesome Testsauce' });
  collection1.insert({ 'name' : 'David Rails' });

  Meteor.publish('testCollection', function () { return collection1.find(); });
} else if (Meteor.isClient) {
  Meteor.subscribe('testCollection');
}

collection1.initEasySearch('name', {
  'query' : function (searchString) {
    if (searchString === 'Testsauce') {
      return false;
    }

    return EasySearch.getSearcher(this.use).defaultQuery(this, searchString);
  }
});

// Tests
Tinytest.add('EasySearch - createSearchIndex, getIndex, getIndexes', function (test) {
  test.throws(function () { EasySearch.createSearchIndex({}, {}); });
  test.throws(function () { EasySearch.createSearchIndex(10, {}); });
  test.throws(function () { EasySearch.createSearchIndex('validName', 10); });
  test.throws(function () { EasySearch.createSearchIndex(function () { }, {}); });

  if (Meteor.isServer) {
    test.expect_fail(function () { EasySearch.createSearchIndex('test', { 'field' : 'a', 'use' : 'doesntExist' }); });
  }

  EasySearch.createSearchIndex('testIndex', {
    'field' : 'testField',
    'customField' : [0, 1, 2]
  });

  test.equal(EasySearch.getIndex('testIndex').customField, [0, 1, 2]);
  test.equal(EasySearch.getIndex('testIndex').field, ['testField']);

  test.instanceOf(EasySearch.getIndexes(), Object);
  test.equal(EasySearch.getIndexes()['testIndex'].field, ['testField']);
  test.isUndefined(EasySearch.getIndexes()['indexThatDoesntExist']);
});

Tinytest.add('EasySearch - initEasySearch', function (test) {
  test.equal(EasySearch.getIndex('estestCollection').name, 'estestCollection');
  test.equal(EasySearch.getIndex('estestCollection').field, ['name']);
  test.isFalse(EasySearch.getIndex('estestCollection').query('Testsauce'));
});

Tinytest.add('EasySearch - eachIndex', function (test) {
  EasySearch.createSearchIndex('eachIndexTestOne', {
    'field' : 'testFieldOne',
    'collection' : collection1
  });

  EasySearch.createSearchIndex('eachIndexTestTwo', {
    'field' : 'testFieldTwo',
    'collection' : collection1
  });

  EasySearch.eachIndex('eachIndexTestOne', function (index, opts) {
    test.equal(index, 'eachIndexTestOne');
    test.equal(opts.field, ['testFieldOne']);
  });

  EasySearch.eachIndex(['eachIndexTestTwo'], function (index, opts) {
    test.equal(index, 'eachIndexTestTwo');
    test.equal(opts.field, ['testFieldTwo']);
  });
});

Tinytest.add('EasySearch - usesSubscriptions', function (test) {
  EasySearch.createSearchIndex('default', {
    field: 'super',
    collection: collection1
  });

  EasySearch.createSearchIndex('notReactive', {
    field: 'super',
    reactive: false,
    use: 'mongo-db',
    collection: collection1
  });

  EasySearch.createSearchIndex('mongo-db', {
    field: 'super',
    use: 'mongo-db',
    collection: collection1
  });

  EasySearch.createSearchIndex('elastic-search', {
    field: 'super',
    use: 'elastic-search-test',
    collection: collection1
  });

  test.isFalse(EasySearch._usesSubscriptions('default'));
  test.isFalse(EasySearch._usesSubscriptions('notReactive'));
  test.isTrue(EasySearch._usesSubscriptions('mongo-db'));
  test.isTrue(EasySearch._usesSubscriptions('elastic-search'));
});


Tinytest.add('EasySearch - transformToFieldSpecifiers', function (test) {
  test.equal(EasySearch._transformToFieldSpecifiers(['name', 'score']), { 'name' : 1, 'score' : 1 });
  test.equal(EasySearch._transformToFieldSpecifiers([]), {});
  test.equal(EasySearch._transformToFieldSpecifiers(), {});
});

Tinytest.add('EasySearch - log', function (test) {
  var originalLog = console.log,
      originalWarn = console.warn;

  console.log = function (msg) {
    return 'I logged: ' + msg;
  };

  console.warn = function (msg) {
    return 'I warned: ' + msg;
  };

  test.equal(EasySearch.log('test'), 'I logged: test');
  test.equal(EasySearch.log('test', 'warn'), 'I warned: test');
  test.equal(EasySearch.log('test2', 'doesNotExist'), 'I logged: test2');

  console.log = originalLog;
  console.warn = originalWarn;
});

Tinytest.add('EasySearch - permission', function (test) {
  EasySearch.createSearchIndex('permissionIndex', {
    permission: function () {
      return false;
    }
  });

  test.throws(function () { EasySearch.search('permissionIndex', 'test'); });
});

if (Meteor.isClient) {
  Tinytest.add('EasySearch - Client - changeProperty', function (test) {
    EasySearch.createSearchIndex('testIndex2', {
      'field' : 'testField',
      'props' : {
        'customField' : 'isAString'
      }
    });

    test.throws(function () { EasySearch.changeProperty('testIndex2', {}, {}); });
    test.throws(function () { EasySearch.changeProperty({}, 'validKey', {}); });

    test.equal(EasySearch.getIndex('testIndex2').props.customField, 'isAString');
    EasySearch.changeProperty('testIndex2', 'customField', 'isAnotherString');
    test.equal(EasySearch.getIndex('testIndex2').props.customField, 'isAnotherString');
  });

  Tinytest.add('EasySearch - Client - changeLimit', function (test) {
    EasySearch.createSearchIndex('testIndex100', {
      'field' : 'testField',
      'limit' : 30
    });

    test.throws(function () { EasySearch.changeLimit('testIndex100', function () {}); });
    test.equal(EasySearch.getIndex('testIndex100').limit, 30);
    EasySearch.changeLimit('testIndex100', 50);
    test.equal(EasySearch.getIndex('testIndex100').limit, 50);
  });

  Tinytest.add('EasySearch - pagination', function (test) {
    var data;

    EasySearch.createSearchIndex('testPagination', {
      field: 'super',
      collection: collection1,
      limit: 20
    });

    test.equal(EasySearch.pagination('testPagination', 1).skip, 0);
    test.equal(EasySearch.pagination('testPagination', 1).limit, 20);
    test.equal(EasySearch.pagination('testPagination', 3).skip, 40);
    test.equal(EasySearch.pagination('testPagination', 3).limit, 20);

    EasySearch.pagination('testPagination', 2);
    data = EasySearch.pagination('testPagination', EasySearch.PAGINATION_NEXT);
    test.equal(data.skip, 40);
    test.equal(data.step, 3);
    data = EasySearch.pagination('testPagination', EasySearch.PAGINATION_NEXT);
    test.equal(data.skip, 60);
    test.equal(data.step, 4);
    EasySearch.pagination('testPagination', 3);
    data = EasySearch.pagination('testPagination', EasySearch.PAGINATION_PREV);
    test.equal(data.skip, 20);
    test.equal(data.step, 2);
    data = EasySearch.pagination('testPagination', EasySearch.PAGINATION_PREV);
    test.equal(data.skip, 0);
    test.equal(data.step, 1);
    data = EasySearch.pagination('testPagination', EasySearch.PAGINATION_PREV);
    test.equal(data.skip, 0);
    test.equal(data.step, 1);


    EasySearch.createSearchIndex('testPaginationOneLimit', {
      field: 'super',
      collection: collection1,
      limit: 1
    });

    test.equal(EasySearch.pagination('testPaginationOneLimit', 1).skip, 0);
    test.equal(EasySearch.pagination('testPaginationOneLimit', 1).limit, 1);

    test.equal(EasySearch.pagination('testPaginationOneLimit', 2).skip, 1);
    test.equal(EasySearch.pagination('testPaginationOneLimit', 2).limit, 1);
  });

  Tinytest.add('EasySearch - Client - filterFunctions', function (test) {
    var filteredConf = EasySearch._filterFunctions({
      'func1' : function () {},
      'awesomeNumber' : 10,
      'awesomeString' : 'test',
      'awesomeObject' : {},
      'func2' : function () {},
      'awesomeArray': ['a', 'b'],
      'awesomeBoolean' : true,
      'collection' : collection1
    });

    test.isUndefined(filteredConf.func1);
    test.isUndefined(filteredConf.func2);
    test.isUndefined(filteredConf.collection);
    test.equal(filteredConf.awesomeNumber, 10);
    test.equal(filteredConf.awesomeString, 'test');
    test.equal(filteredConf.awesomeObject, {});
    test.equal(filteredConf.awesomeArray, ['a', 'b']);
    test.equal(filteredConf.awesomeBoolean, true);
  });

  Tinytest.addAsync('EasySearch - Client - search #1', function (test, completed) {
    EasySearch.search('estestCollection', 'er Po', function (err, data) {
      test.equal(data.total, 1);
      test.equal(data.results[0].name, "Super Pomodoro");
      completed();
    });
  });

  Tinytest.addAsync('EasySearch - Client - search #2', function (test, completed) {
    EasySearch.searchMultiple(['estestCollection'], 'id R', function (err, data) {
      test.equal(data.total, 1);
      test.equal(data.results[0].name, "David Rails");
      completed();
    });
  });

  Tinytest.addAsync('EasySearch - Client - search #3', function (test, completed) {
    EasySearch.search('estestCollection', 'Testsauce', function (err, data) {
      test.equal(data.total, 0);
      test.equal(data.results.length, 0);
      completed();
    });
  });

  Tinytest.addAsync('EasySearch - Client - search #4', function (test, completed) {
    EasySearch.search('estestCollection', 'estsauce', function (err, data) {
      test.equal(data.total, 1);
      test.equal(data.results[0].name, 'Awesome Testsauce');
      completed();
    });
  });

  Tinytest.add('EasySearch - Client - getSearcher, getSearchers', function (test) {
    test.instanceOf(EasySearch.getSearcher('minimongo').createSearchIndex, Function);
    test.instanceOf(EasySearch.getSearchers()['minimongo'], Object);
    test.instanceOf(EasySearch.getSearcher('minimongo').search, Function);
    test.equal(typeof EasySearch.getSearcher('mongo-db'), "undefined");
  });

} else if (Meteor.isServer) {
  Tinytest.add('EasySearch - Server - config', function (test) {
    test.equal(EasySearch.config(), undefined);
    // no need to actually set it up, since it's a straight call to the elastic search client
  });

  Tinytest.add('EasySearch - Server - createSearcher', function (test) {
    // No solr implementation
    test.expect_fail(function () { EasySearch.createSearchIndex('test', { 'field' : 'a', 'use' : 'solr' }); });

    EasySearch.createSearcher('solr', {
      'createSearchIndex' : function () {},
      'search' : function () {}
    });

    // Now it has one
    test.isUndefined(EasySearch.createSearchIndex('test', { 'field' : 'a', 'use' : 'solr' }));

    test.expect_fail(function () {
      EasySearch.createSearcher(10, {
        'createSearchIndex' : function () {}
      });
    });

    test.expect_fail(function () {
      EasySearch.createSearcher('lucene', {});
    });
  });

  Tinytest.add('EasySearch - Server - getSearcher, getSearchers', function (test) {
    test.instanceOf(EasySearch.getSearcher('mongo-db').createSearchIndex, Function);
    test.instanceOf(EasySearch.getSearcher('mongo-db').search, Function);

    test.instanceOf(EasySearch.getSearcher('elastic-search').createSearchIndex, Function);
    test.instanceOf(EasySearch.getSearcher('elastic-search').search, Function);

    test.instanceOf(EasySearch.getSearchers()['mongo-db'], Object);
    test.instanceOf(EasySearch.getSearchers()['elastic-search'], Object);
    test.equal(typeof EasySearch.getSearcher('minimongo'), "undefined");
  });

  Tinytest.add('EasySearch - Server - _transformFieldsToIndexDocument', function (test) {
    test.equal(EasySearch._transformFieldsToIndexDocument([]), {});
    test.equal(EasySearch._transformFieldsToIndexDocument(['name']), { name: 'text' });
    test.equal(EasySearch._transformFieldsToIndexDocument(['name', 'score']), { name: 'text', score: 'text' });
  });
}
