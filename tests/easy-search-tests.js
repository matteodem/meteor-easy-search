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

collection1.initEasySearch('name');

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

if (Meteor.isClient) {
    Tinytest.add('EasySearch - Client - changeProperty', function (test) {
        EasySearch.createSearchIndex('testIndex2', {
            'field' : 'testField',
            'customField' : 'isAString'
        });

        test.throws(function () { EasySearch.changeProperty('testIndex2', {}, {}); });
        test.throws(function () { EasySearch.changeProperty({}, 'validKey', {}); });

        test.equal(EasySearch.getIndex('testIndex2').customField, 'isAString');
        EasySearch.changeProperty('testIndex2', 'customField', 'isAnotherString');
        test.equal(EasySearch.getIndex('testIndex2').customField, 'isAnotherString');
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
} else if (Meteor.isServer) {
    Tinytest.add('EasySearch - Server - config', function (test) {
        test.equal(EasySearch.config().host, 'localhost:9200');

        EasySearch.config({
            'host' : 'localhost:8000'
        });

        test.equal(EasySearch.config().host, 'localhost:8000');
    });

    Tinytest.add('EasySearch - Server - search #1', function (test) {
        var data = EasySearch.search('estestCollection', 'sauCE', { 'limit' : 10 });
        test.equal(data.results[0].name, "Awesome Testsauce");
    });

    Tinytest.add('EasySearch - Server - search #2', function (test) {
        var data = EasySearch.search('estestCollection', 'Super duper', { });
        test.equal(data.results.length, 0);
    });

    Tinytest.add('EasySearch - Server - extendSearch', function (test) {
        // No solr implementation
        test.expect_fail(function () { EasySearch.createSearchIndex('test', { 'field' : 'a', 'use' : 'solr' }); });

        EasySearch.extendSearch('solr', {
            'createSearchIndex' : function () {},
            'search' : function () {}
        });

        // Now it has one
        test.isUndefined(EasySearch.createSearchIndex('test', { 'field' : 'a', 'use' : 'solr' }));

        test.expect_fail(function () {
            EasySearch.extendSearch(10, {
                'createSearchIndex' : function () {},
                'search' : function () {}
            });
        });

        test.expect_fail(function () {
            EasySearch.extendSearch('lucene', {});
        });
    });
}
