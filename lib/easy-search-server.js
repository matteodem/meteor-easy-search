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
        newDoc[key] = "string" === typeof value ? value : JSON.stringify(value);
    });

    return newDoc;
}

EasySearch = {
    'createSearchIndex' : function (name, options) {
        indexes[name] = options;

        options.collection.find().observeChanges({
            added: function (id, fields) {
                var doc = getESFields(fields);

                // add to index
                ElasticSearchClient.index(name, 'default_type', doc, id)
                    .on('data', function (data) {
                        console.log('EasySearch: Added document to Elastic Search:');
                        console.log('EasySearch: ' + data + "\n");
                    })
                    .exec();
            }
        });
    },
    'search' : function (name, searchString, callback) {
        var returnData,
            that = this,
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
            ElasticSearchClient.search(name, 'default_type', queryObj, function (error, data) {
                console.log(data);
                done(null, that.getMongoDocumentObject(data));
            });
        });

        return returnData;
    },
    'changeProperty' : function(name, key, value) {
        if (!_.isString(name) || !_.isString(key)) {
            throw new Meteor.Error('name and key of the property have to be strings!');
        }

        indexes[name][key] = value;
    },
    'getMongoDocumentObject' : function (data) {
        data = _.isString(data) ? JSON.parse(data) : data;

        return _.map(data.hits.hits, function (resultSet) {
            var mongoDbDocFake = resultSet['_source'];

            mongoDbDocFake['_id'] = resultSet['_id'];

            return resultSet['_source'];
        });
    }
};

Meteor.methods({
    easySearch: function (name, searchString) {
        return EasySearch.search(name, searchString);
    }
});
