EasySearch = (function () {
    var ElasticSearchClient,
        Searchers,
        indexes = {},
        config = {
            host: 'localhost',
            port: 9200,
            secure: false
        },
        defaultQuery = function (searchFields, searchString) {
            return {
                "fuzzy_like_this" : {
                    "fields" : searchFields,
                    "like_text" : searchString
                }
            };
        },
        Future = Npm.require('fibers/future'),
        ElasticSearchInstance = Npm.require('elasticsearchclient');

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
     * Write a document to a specified index.
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

    /**
     * Searchers which contain all types which can be used to search content, until now:
     *
     * elastic-search: Use an elastic search server to search with (fast)
     * mongo-db: Use mongodb to search (more convenient)
     */
    Searchers = {
        'elastic-search' : {
            /**
             * Setup some observers on the mongo db collection provided.
             *
             * @param {String} name
             * @param {Object} options
             */
            'createSearchIndex' : function (name, options) {
                if ("undefined" === typeof ElasticSearchClient) {
                    ElasticSearchClient = new ElasticSearchInstance(config)
                }

                options.collection.find().observeChanges({
                    added: function (id, fields) {
                        writeToIndex(name, getESFields(fields), id);
                    },
                    changed: function (id, fields) {
                        // Overwrites the current document with the new doc
                        writeToIndex(name, getESFields(options.collection.findOne(id)), id);
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
             * Get the data out of the JSON elastic search response.
             *
             * @param {Object} data
             * @returns {Array}
             */
            'extractJSONData' : function (data) {
                data = _.isString(data) ? JSON.parse(data) : data;

                var results = _.map(data.hits.hits, function (resultSet) {
                    var mongoDbDocFake = resultSet['_source'];

                    mongoDbDocFake['_id'] = resultSet['_id'];

                    return resultSet['_source'];
                });

                return {
                    'results' : results,
                    'total' : data.hits.total
                };
            },
            /**
             * Perform a search with Elastic Search, using fibers.
             *
             * @param {String} name
             * @param {String} searchString
             * @param {Object} options
             * @param {Function} callback
             * @returns {*}
             */
            'search' : function (name, searchString, options, callback) {
                var queryObj,
                    that = this,
                    searchFields,
                    fut = new Future(),
                    index = indexes[name];

                if (!_.isObject(index)) {
                    return;
                }

                searchFields = _.isArray(options.field) ? options.field : [options.field];

                queryObj = {
                    "query" : index.query(searchFields, searchString),
                    "size" : options.limit
                };

                if ("function" === typeof callback) {
                    ElasticSearchClient.search(name, queryObj, callback);
                    return;
                }

                // Most likely client call, return data set
                ElasticSearchClient.search(name, 'default_type', queryObj, function (error, data) {
                    if ("raw" !== index.format) {
                        data = that.extractJSONData(data);
                    }

                    fut['return'](data);
                });

                return fut.wait();
            }
        },
        'mongo-db' : {
            /**
             * Set up a search index.
             *
             * @param name
             * @param options
             * @returns {*}
             */
            'createSearchIndex' : function (name, options) {
                // Don't have to setup anything
            },
            /**
             * Get the valid mongodb selector of an index
             *
             * @param {Object} index
             * @param {String} searchString
             * @param {Obejct} options
             * @returns {Object}
             */
            'getSelector' : function (index, searchString, options) {
                var orSelector,
                    selector = {},
                    field = options.field,
                    stringSelector = options.exact ? searchString : { '$regex' : '.*' + searchString + '.*', '$options' : '-i' };

                if (_.isString(field)) {
                    selector[field] = stringSelector;
                    return selector;
                }

                // Should be an array
                selector['$or'] = [];

                _.each(field, function (fieldString) {
                    orSelector = {};
                    orSelector[fieldString] = stringSelector;

                    selector['$or'].push(orSelector);
                });

                return selector;
            },
            /**
             *
             * Perform a really simple search with mongo db.
             *
             * @param {String} name
             * @param {String} searchString
             * @param {Object} options
             * @returns {*}
             */
            'search' : function (name, searchString, options) {
                var selector,
                    that = this,
                    index = indexes[name];

                if (!_.isObject(index)) {
                    return;
                }

                options.limit = options.limit || 10;
                options.exact = options.exact || false;

                // if several, fields do an $or search, otherwise only over the field
                selector = that.getSelector(index, searchString, options);

                cursor = index.collection.find(selector);

                return {
                    'results' : _.first(cursor.fetch(), options.limit),
                    'total' : cursor.count()
                };
            }
        }
    };

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
         * Create a search index for use with Elastic Search.
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            options.format = "string" === typeof options.format ? options.format : "mongo";
            options.limit = "number" === typeof options.limit ? options.limit : 10;
            options.query = "function" === typeof options.query ? options.query : defaultQuery;
            options.use = "string" === typeof options.use ? options.use : 'elastic-search';

            indexes[name] = options;

            if ("undefined" === typeof Searchers[options.use]) {
                throw new Meteor.Error(500, "Didnt find the type: '" + options.use + "' to be searched with.");
            }

            Searchers[options.use].createSearchIndex(name, options);
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
        },
        /**
         * Perform a search.
         *
         * @param {String} name             the search index
         * @param {String} searchString     the string to be searched
         * @param {Object} options          defined with createSearchInde
         * @param {Function} callback       optional callback to be used
         */
        'search' : function (name, searchString, options, callback) {
            var searcherType = indexes[name].use;

            if ("undefined" === typeof Searchers[searcherType]) {
                throw new Meteor.Error(500, "Couldnt search with the type: '" + searcherType + "'");
            }

            return Searchers[searcherType].search(name, searchString, options, callback);
        },
        /**
         * Get the ElasticSearchClient
         * @see https://github.com/phillro/node-elasticsearch-client
         *
         * @return {ElasticSearchInstance}
         */
        'getElasticSearchClient' : function () {
            return ElasticSearchClient;
        },
        /**
          * Retrieve all index configurations
          */
        'getIndexes' : function () {
            return indexes;
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
    easySearch: function (name, searchString, options) {
        return EasySearch.search(name, searchString, options);
    }
});
