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

  Tinytest.add('EasySearch - Components - mapIndexesWithLogic', function (test) {
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
}
