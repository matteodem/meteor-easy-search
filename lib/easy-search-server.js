var indexes = {},
    ElasticSearchInstance = Npm.require('elasticsearchclient')
    ElasticSearchClient = new ElasticSearchInstance({
        host: 'localhost',
        port: 9200,
        secure: false
    });

function getESFields(doc) {
    var newDoc = {};

    _.each(doc, function (value, key) {
        newDoc[key] = "string" === typeof value ? value : /*JSON.stringify(value)*/ '';
    });

    return newDoc;
}

EasySearch = {};

EasySearch.createSearchIndex = function (name, options) {
    indexes[name] = options;

    options.collection.find().observeChanges({
        added: function (id, fields) {
            var doc = getESFields(fields);
            console.log(doc);
            // add to index
            ElasticSearchClient.index(name, 'default_type', doc, id)
                .on('data', function (data) {
                    console.log('Added document to Elastic Search:');
                    console.log(data);
                })
                .exec();
        }
    });
};

EasySearch.search = function (name, searchString, callback) {
    var returnData,
        queryObj = {},
        field = indexes[name].field;

    field = _.isArray(field) ? field : [field];
    
    queryObj = {
        "query" : {
            "fuzzy_like_this" : {
                "fields" : field,
                "like_text" : searchString
            }
        }
    };

    if (_.isFunction(callback)) {
        ElasticSearchClient.search(name, queryObj, callback);

        return;
    }

    returnData = Meteor.sync(function (done) {
        // Most likely client call, return data set
        ElasticSearchClient.search(name, queryObj, function (error, data) {
            done(null, JSON.parse(data));
        });
    });

    return returnData;
}


// Meteor search method
Meteor.methods({
    easySearch: function (name, searchString) {
        return EasySearch.search(name, searchString);
    }
});
