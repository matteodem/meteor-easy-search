EasySearch = (function () {
    var indexes = {},
        config = {
            host: 'localhost',
            port: 9200,
            secure: false
        },
        ElasticSearchInstance = Npm.require('elasticsearchclient'),
        ElasticSearchClient = new ElasticSearchInstance(config);

    function getESFields(doc) {
        var newDoc = {};

        _.each(doc, function (value, key) {
            newDoc[key] = "string" === typeof value ? value : JSON.stringify(value);
        });

        return newDoc;
    }

    function writeToIndex(name, doc, id) {
        // add to index
        ElasticSearchClient.index(name, 'default_type', doc, id)
            .on('data', function (data) {
                if (config.debug && console) {
                    console.log('EasySearch: Added / Replaced document to Elastic Search:');
                    console.log('EasySearch: ' + data + "\n");
                }
            })
            .exec();
    }
    
    return {
        'config' : function (newConfig) {
            config = _.extend(config, newConfig);
            ElasticSearchClient = new ElasticSearchInstance(config);
        },
        'createSearchIndex' : function (name, options) {
            indexes[name] = options;

            options.collection.find().observeChanges({
                added: function (id, fields) {
                    writeToIndex(name, getESFields(fields), id);
                },
                changed: function (id, fields) {
                    // Overwrites the current document with the new doc
                    writeToIndex(name, getESFields(fields), id);
                },
                removed: function (id) {
                    ElasticSearchClient.deleteDocument(name, 'default_type', id)
                        .on('data', function (data) {
                            if (config.debug && console) {
                                console.log('EasySearch: Removed document off Elastic Search:');
                                console.log('EasySearch: ' + data + "\n");
                            }
                        })
                        .exec();
                }
            });
        },
        'search' : function (name, searchString, callback) {
            var field,
                returnData,
                that = this,
                queryObj = {},
                index = indexes[name];

            if (!_.isObject(index)) {
                return;
            }

            field = _.isArray(index.field) ? index.field : [index.field];

            queryObj = {
                "query" : {
                    "fuzzy_like_this" : {
                        "fields" : field,
                        "like_text" : searchString
                    }
                },
                "size" : index.limit
            };

            if ("function" === typeof callback) {
                ElasticSearchClient.search(name, queryObj, callback);
                return;
            }

            returnData = Meteor.sync(function (done) {
                // Most likely client call, return data set
                ElasticSearchClient.search(name, 'default_type', queryObj, function (error, data) {
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
})();
    
Meteor.methods({
    easySearch: function (name, searchString) {
        return EasySearch.search(name, searchString);
    }
});
