EasySearch = (function () {
    var indexes = {},
        config = {
            host: 'localhost',
            port: 9200,
            secure: false
        },
        conditions = {
            'onChangeProperty' : function () {
                return true;
            }
        },
        Future = Npm.require('fibers/future'),
        ElasticSearchInstance = Npm.require('elasticsearchclient'),
        ElasticSearchClient = new ElasticSearchInstance(config);

    /**
     * Return Elastic Search indexable data.
     *
     * @param {Object} doc
     * @returns {Object}
     */
    function getESFields(doc) {
        var newDoc = {};

        _.each(doc, function (value, key) {
            newDoc[key] = "string" === typeof value ? value : JSON.stringify(value);
        });

        return newDoc;
    }

    /**
     * Write a document to a specified index
     *
     * @param {String} name
     * @param {Object} doc
     * @param {String} id
     */
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
        /**
         * Override the config for Elastic Search.
         *
         * @param {object} newConfig
         */
        'config' : function (newConfig) {
            if ("undefined" === typeof newConfig) {
                return config;
            }

            config = _.extend(config, newConfig);
            ElasticSearchClient = new ElasticSearchInstance(config);
        },
        /**
         * Override conditions or return conditions if no parameter passed.
         *
         * @param newConditions
         * @returns {object}
         */
        'conditions' : function (newConditions) {
            if ("undefined" === typeof newConditions) {
                return conditions;
            }

            conditions = _.extend(conditions, newConditions);
        },
        /**
         * Create a search index for Elastic Search, which resembles a MongoDB Collection.
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            options.format = "string" === typeof options.format ? options.format : "mongo";
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
        /**
         * Perform a really simple search.
         *
         * @param {String} name
         * @param {String} searchString
         * @param {Function} callback
         */
        'search' : function (name, searchString, callback) {
            var field,
                queryObj,
                that = this,
                fut = new Future(),
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

            // Most likely client call, return data set
            ElasticSearchClient.search(name, 'default_type', queryObj, function (error, data) {
                if ("mongo" === index.format) {
                    data = that.getMongoDocumentObject(data);
                }

                fut['return'](data);
            });

            return fut.wait();
        },
        /**
         * Change a property specified for the index.
         *
         * @param {String} name
         * @param {String} key
         * @param {String} value
         */
        'changeProperty' : function(name, key, value) {
            if (!_.isString(name) || !_.isString(key)) {
                throw new Meteor.Error('name and key of the property have to be strings!');
            }

            indexes[name][key] = value;
        },
        /**
         * Get a fake representation of a mongo document.
         *
         * @param {Object} data
         * @returns {Array}
         */
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
    /**
     * Make search possible on the client.
     *
     * @param {String} name
     * @param {String} searchString
     */
    easySearch: function (name, searchString) {
        return EasySearch.search(name, searchString);
    },
    /**
     * Make changing properties possible on the client.
     *
     * @param {String} name
     * @param {String} key
     * @param {String} value
     */
    easySearchChangeProperty: function(name, key, value) {
        if (EasySearch.conditions().onChangeProperty(name, key, value)) {
            EasySearch.changeProperty(name, key, value);
        }
    }
});
