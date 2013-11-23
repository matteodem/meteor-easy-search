// @see https://www.eventedmind.com/posts/meteor-testing-packages-with-tinytest
var testCollection = new Meteor.Collection('cars'),
    anotherCollection = new Meteor.Collection('anotherCollection');

if (Meteor.isClient) {
    Meteor.subscribe('cars');
    Meteor.subscribe('anotherCollection');
} else if (Meteor.isServer) {
    // Clear up collection
    testCollection.remove({ });
    anotherCollection.remove({ });

    anotherCollection.allow({
        'insert' : function () {
            return true;
        },
        'update' : function () {
            return true;
        },
        'remove' : function () {
            return true;
        }
    });

    Meteor.publish('cars', function () {
        return testCollection.find();
    });

    Meteor.publish('anotherCollection', function () {
        return anotherCollection.find();
    });
}

Tinytest.add('EasyCheck - Constructor', function (test) {
    var config = { 'foo' : 'string' },
        testCheck = new EasyCheck(config);

    test.throws(function () {
        new EasyCheck(null);
    }, Error, 'Should throw an error if no config is given');

    test.instanceOf(testCheck, EasyCheck, 'Should be instance of itself');
    test.isTrue("function" == typeof testCheck.check);
});

Tinytest.add('EasyCheck - check', function (test) {
    var easyCheck = new EasyCheck({ 'name' : 'string', 'additional' : 'boolean:-1:false' });

    test.isTrue(easyCheck.check({ 'name' : 'hello' }));
    test.isTrue(easyCheck.check({ 'name' : 'hello', 'additional' : false }));

    // Empty
    test.isFalse(easyCheck.check({}));
    // Same amount of required values but not the right property
    test.isFalse(easyCheck.check({ 'additional' : true }));
    // Same amount of properties but not valid names
    test.isFalse(easyCheck.check({ 'name' : 'hello', 'additionalNotHere' : true }));
    // Same amount of properties but not valid types
    test.isFalse(easyCheck.check({ 'name' : 'hello', 'additional' : "true" }));
    // Not the right type
    test.isFalse(easyCheck.check({ 'name' : 10.012 }));
    // Too many properties
    test.isFalse(easyCheck.check({ 'name' : 'hello', 'additional' : true, 'a' : 'b' }));
    // Everything right, but empty
    test.isFalse(easyCheck.check({ 'name' : '' }));
});

Tinytest.add('EasyCheck - check - references', function (test) {
    var id,
        referencedCheck = new EasyCheck(
            {
                'player' : 'string',
                'foreignId' : {
                    type : 'string',
                    references : {
                        'collection' : anotherCollection
                    }
                },
                'numberProperty' : {
                    type : 'number',
                    references : {
                        'collection' : anotherCollection,
                        'field' : 'someNumber'
                    },
                    required : false
                },
                'car' : {
                    type : 'array',
                    references : {
                        'collection' : anotherCollection,
                        'field' : 'name'
                    }
                }
            }
        );

    id = anotherCollection.insert({ 'name' : 'this is a test', 'someNumber' : 100 });

    test.isTrue(referencedCheck.check({
        'player' : 'hello',
        'foreignId' : id,
        'numberProperty' : 100,
        'car' : ['this is a test']
    }));

    test.isFalse(referencedCheck.check({
        'player' : 'hello',
        'foreignId' : id,
        'numberProperty' : 101,
        'car' : ['this is a test']
    }));

    test.isFalse(referencedCheck.check({
        'player' : 'hello',
        'foreignId' : id,
        'car' : ['this is a test', false]
    }));

    test.isFalse(referencedCheck.check({
        'player' : 'hello',
        'foreignId' : 'justSomething',
        'car' : ['this doesnt exist']
    }));

    anotherCollection.remove(id);
});

Tinytest.add('EasyCheck - check - checkLayers', function (test) {
    var playerCheck = new EasyCheck({ 'name' : 'string' }),
        layeredCheck = new EasyCheck(
            {
                'player' : { type : playerCheck },
                'parentPlayer' : playerCheck,
                'level' : 'number',
                'isOnline' : 'boolean'
            }
        );

    test.isTrue(layeredCheck.check(
        { 'player' : { 'name' : 'peter' }, 'level' : 100, 'isOnline' : true, 'parentPlayer' : { 'name' : 'peterPeter' } }
    ));

    test.isTrue(layeredCheck.check(
        { 'player' : { 'name' : 'peter' }, 'level' : 100, 'isOnline' : true, 'parentPlayer' : { 'name' : 'peterFather' } }
    ));

    layeredCheck.check(
        { 'player' : { 'name' : true }, 'level' : 100, 'isOnline' : true, 'parentPlayer' : { 'name' : 'peterPeter' } }
    );
    test.isFalse(layeredCheck.check(
        { 'player' : { 'name' : true }, 'level' : 100, 'isOnline' : true, 'parentPlayer' : { 'name' : 'peterPeter' } }
    ));
    test.isFalse(layeredCheck.check({ 'player' : { 'name' : 10.00 }, 'level' : 100, 'isOnline' : true }));
    test.isFalse(layeredCheck.check({ 'player' : { 'name' : 'peter', 'addi' : 'tional' }, 'level' : 100, 'isOnline' : true }));
});

Tinytest.add('EasyCheck - check - checkRegex', function (test) {
    var regexCheck = new EasyCheck(
        {
            'onlyBuchstaben' : {
                type : 'string',
                regex : /[a-z]+/i
            }
        }
    );

    test.isTrue(regexCheck.check({ 'onlyBuchstaben' : 'testString' }));
    test.isFalse(regexCheck.check({ 'foo' : 'bar '}));
});

Tinytest.add('EasyCheck - check - minLength', function (test) {
    var minLengthCheck = new EasyCheck(
        {
            'name' : {
                type : 'string',
                minLength : 10
            }
        }
    );

    test.isTrue(minLengthCheck.check({ 'name' : 'testString' }));
    test.isTrue(minLengthCheck.check({ 'name' : '              ' }));
    test.isFalse(minLengthCheck.check({ 'name' : 'bar '}));
    test.isFalse(minLengthCheck.check({ 'name' : ' '}));
});

Tinytest.add('EasyCheck - check - contains', function (test) {
    var minLengthCheck = new EasyCheck(
        {
            'names' : {
                type : 'array',
                minLength : 2,
                maxLength : 4,
                contains : 'string'
            },
            'bools' : {
                type : 'array',
                required : false,
                contains : 'boolean'
            },
            'inValid' : {
                type : 'string',
                required : false,
                contains : 'string'
            }
        }
    );

    test.isTrue(minLengthCheck.check({ 'names' : ['Hans', 'Jürg', 'Urs'] }));
    test.isTrue(minLengthCheck.check({ 'names' : ['Urs', 'Jürg'], 'bools' : [true, false, true] }));
    test.isFalse(minLengthCheck.check({ 'names' : ['Urs'] }));
    test.isFalse(minLengthCheck.check({ 'names' : ['Urs', 'Jürg'], 'inValid' : ['hello', 'hey'] }));
    test.isFalse(minLengthCheck.check({ 'names' : ['Urs', 'Jürg'], 'bools' : [true, false, 'wrong'] }));
});

Tinytest.add('EasyCheck - Helpers - getFieldConfig', function (test) {
    var fieldConfigCheck = new EasyCheck(
        {
            'foo' : 'string'
        }
    );

    test.equal(
        fieldConfigCheck._helpers.getFieldConfig({ 'I am' : 'not valid' }),
        {
            type : 'string',
            maxLength : -1,
            required : true,
            'I am' : 'not valid' },
        'Should return the object I\'ve entered with the default values'
    );

    test.equal(
        fieldConfigCheck._helpers.getFieldConfig('string'),
        {
            type : 'string',
            maxLength : -1,
            required : true
        },
        'Should return an object only containing string'
    );

    test.equal(
        fieldConfigCheck._helpers.getFieldConfig('string:25'),
        {
            type : 'string',
            maxLength: 25,
            required : true
        },
        'Should return an object containing string and length'
    );

    test.equal(
        fieldConfigCheck._helpers.getFieldConfig('string:100:true'),
        {
            type : 'string',
            maxLength : 100,
            required : true
        },
        'Should return an object containing string, length and if it\'s required'
    );
});

Tinytest.add('EasyCheck - Config', function (test) {
    var configCheck = new EasyCheck(
        {
            'testName' : 'string:-1:false',
            'testStreet' : {
                type : 'boolean',
                required : false
            }
        }
    );

    test.equal(
        configCheck._config,
        {
            'testName' : {
                type : 'string',
                maxLength : -1,
                required : false
            },
            'testStreet' : {
                type : 'boolean',
                maxLength : -1,
                required : false
            }
        },
        'Should return config as it\'s written in by getEasyConfig '
    );
});

Tinytest.add('EasyCheck - Helpers - getEasyConfig', function (test) {
    var easyConfigCheck = new EasyCheck(
        {
            'foo' : 'string'
        }
    );

    test.equal(
        easyConfigCheck._helpers.getEasyConfig(
            {
                'name' : 'string',
                'address' : {
                    type : 'number',
                    maxLength : 255
                }
            }
        ),
        {
            'name' : {
                type : 'string',
                maxLength : -1,
                required : true
            },
            'address' : {
                type : 'number',
                maxLength : 255,
                required : true
            }
        },
        'Should return the config with a globally recognizable structure'
    );
});

Tinytest.add('EasyCheck - with Collection in Constructor', function (test) {
    var firstDoc = { 'name' : 'hello' },
        secondDoc = { 'name' : 'testHello2', 'address' : 'anotherString' },
        easyCheck = new EasyCheck(
            {
                'name' : 'string',
                'address' : 'string:255:false'
            },
            testCollection
        );

    test.isTrue(typeof testCollection.easyInsert == "function");
    test.isTrue(typeof testCollection.easyUpdate == "function");
    test.isTrue(typeof testCollection.easyRemove == "function");

    test.isFalse(testCollection.easyInsert({ 'asdfname' : 'hello' }));
    test.isFalse(testCollection.easyInsert({ 'name' : 'testHello2', 'address' : 'anotherString', 'something' : 'foo' }));

    testCollection.easyInsert(firstDoc);
    testCollection.easyInsert(secondDoc);

    test.equal(firstDoc.name, testCollection.findOne(firstDoc).name);
    test.equal(secondDoc.name, testCollection.findOne(secondDoc).name);

    testCollection.easyRemove(testCollection.findOne(firstDoc)._id);
    testCollection.easyRemove(testCollection.findOne(secondDoc)._id);

    test.isUndefined(testCollection.findOne(firstDoc));
    test.isUndefined(testCollection.findOne(secondDoc));
});

Tinytest.add('EasyCheck - Constructor - onInsert / onUpdate and so on', function (test) {
    var firstDoc = { 'name' : 'this is it' },
        anotherCheck = new EasyCheck(
            {
                'name' : 'string',
                'address' : 'string:255:false'
            },
            anotherCollection,
            {
                onInsert : function (doc) {
                    return doc.name === "this is it";
                }
            }
        );

    // Won't work since the onInsert needs a "this is it" as a name
    test.isFalse(anotherCollection.easyInsert({ 'name' : 'hello2TestTest' }));
    test.isUndefined(anotherCollection.findOne({ 'name' : 'hello2TestTest' }));

    // Will work
    test.isUndefined(anotherCollection.easyInsert(firstDoc));
    test.equal(firstDoc.name, anotherCollection.findOne(firstDoc).name);
    test.isUndefined(anotherCollection.easyRemove(anotherCollection.findOne(firstDoc)._id));
    test.isUndefined(anotherCollection.findOne(firstDoc));
});

Tinytest.add('EasyCheck - Factory - addType', function (test) {
    var simpleCheck = new EasyCheck(
            {
                'name' : 'string',
                'address' : 'string:255:false'
            }
        ),
        typeObj = {
            'check' : function (value) {
                return true;
            }
        };

    test.isTrue("object" === typeof simpleCheck.factory.types);
    simpleCheck.factory.addType('another type', typeObj);
    test.equal(typeObj, simpleCheck.factory.types["another type"]);
    simpleCheck.factory.addType("illegal type", false);
    test.isUndefined(simpleCheck.factory.types["illegal type"]);
});