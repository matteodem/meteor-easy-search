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
  'permission' : function (string) {
    return string !== 'Testsauce';
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
    use: 'elastic-search',
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
