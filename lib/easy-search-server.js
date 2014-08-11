/**
 * @title EasySearch Server Methods
 * @overview These are all the methods exposed on the Server.
 * @author Matteo De Micheli
 * @license MIT
 *
 */

EasySearch = (function () {
    'use strict';

    var ElasticSearchClient,
        Searchers,
        indexes = {
            /*
            collection: Meteor.Collection (required),
            field: [string] || string (required),
            sort: function (searchFields),
            query : function (searchFields),
            limit: number (default: 10)
            format: string (default: mongo),
            use : string (default: 'mongo-db')

            @see defaultOptions
            */
        },
        // Default config used in EasySearch.config()
        config = {
            host : 'localhost:9200'
        },
        // Default options used in EasySearch.createSearchIndex()
        defaultOptions = {
            'format' : 'mongo',
            'limit' : 10,
            /* also useable: 'elastic-search' */
            'use' : 'mongo-db',
            'sort' : function () {
                return Searchers[this.use].defaultSort(this);
            },
            /*
             * When using elastic-search it's the query object,
             * while using with mongo-db it's the selector object.
             *
             * @param {String} searchString
             * @return {Object}
             */
            'query' : function (searchString) {
                return Searchers[this.use].defaultQuery(this, searchString);
            }
        },
        Future = Npm.require('fibers/future'),
        ElasticSearch = Npm.require('elasticsearch');

    /**
     * Return Elastic Search indexable data.
     *
     * @param {Object} doc      the document to get the values from
     * @return {Object}
     */
    function getESFields(doc) {
        var newDoc = {};

        _.each(doc, function (value, key) {
            newDoc[key] = "string" === typeof value ? value : JSON.stringify(value);
        });

        return newDoc;
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
             * Write a document to a specified index.
             *
             * @param {String} name
             * @param {Object} doc
             * @param {String} id
             */
            'writeToIndex' : function (name, doc, id) {
                // add to index
                ElasticSearchClient.index({
                    index : name,
                    type : 'default',
                    id : id,
                    body : doc
                }, function (err, data) {
                    if (err) {
                        console.log('Had error adding a document!');
                        console.log(err);
                    }

                    if (config.debug && console) {
                        console.log('EasySearch: Added / Replaced document to Elastic Search:');
                        console.log('EasySearch: ' + data + "\n");
                    }
                });
            },
            /**
             * Setup some observers on the mongo db collection provided.
             *
             * @param {String} name
             * @param {Object} options
             */
            'createSearchIndex' : function (name, options) {
                var searcherScope = this;

                if ("undefined" === typeof ElasticSearchClient) {
                    ElasticSearchClient = new ElasticSearch.Client(config);
                }

                options.collection.find().observeChanges({
                    added: function (id, fields) {
                        searcherScope.writeToIndex(name, getESFields(fields), id);
                    },
                    changed: function (id, fields) {
                        // Overwrites the current document with the new doc
                        searcherScope.writeToIndex(name, getESFields(options.collection.findOne(id)), id);
                    },
                    removed: function (id) {
                        client.delete({
                          index: name,
                          type: 'default',
                          id: id
                        }, function (error, response) {
                          console.log('Removed document with id ( ' +  id + ' )!');
                          console.log(error);
                        });
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
                var bodyObj,
                    that = this,
                    fut = new Future(),
                    index = indexes[name],
                    searchFields = options.field;

                if (!_.isObject(index)) {
                    return;
                }

                bodyObj = {
                    "query" : index.query(searchString),
                    "sort" : index.sort(searchString),
                    "size" : options.limit
                };

                if ("function" === typeof callback) {
                    ElasticSearchClient.search(name, queryObj, callback);
                    return;
                }

                // Most likely client call, return data set
                ElasticSearchClient.search({
                    index : name,
                    body : bodyObj
                }, function (error, data) {
                    if (error) {
                        console.log('Had an error while searching!');
                        console.log(error);
                        return;
                    }

                    if ("raw" !== index.format) {
                        data = that.extractJSONData(data);
                    }

                    fut['return'](data);
                });

                return fut.wait();
            },
            /**
             * The default ES query object used for searching the results.
             *
             * @param {Object} options
             * @return array
             */
            'defaultQuery' : function (options, searchString) {
                return {
                    "fuzzy_like_this" : {
                        "fields" : options.field,
                        "like_text" : searchString
                    }
                };
            },
            /**
             * The default ES sorting method used for sorting the results.
             *
             * @param {Object} options
             * @return array
             */
            'defaultSort' : function (options) {
                return options.field;
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
             *
             * Perform a really simple search with mongo db.
             *
             * @param {String} name
             * @param {String} searchString
             * @param {Object} options
             * @param {Function} callback
             * @returns {*}
             */
            'search' : function (name, searchString, options, callback) {
                var cursor,
                    selector,
                    that = this,
                    index = indexes[name];

                if (!_.isObject(index)) {
                    return;
                }

                options.limit = options.limit || 10;

                // if several, fields do an $or search, otherwise only over the field
                selector = index.query(searchString);

                cursor = index.collection.find(selector, {
                    sort : index.sort(searchString)
                });

                if (_.isFunction(callback)) {
                    callback({
                        'results' : _.first(cursor.fetch(), options.limit),
                        'total' : cursor.count()
                    });
                }

                return {
                    'results' : _.first(cursor.fetch(), options.limit),
                    'total' : cursor.count()
                };
            },
            /**
             * The default mongo-db query - selector used for searching.
             *
             * @param {Object} index
             * @param {String} searchString
             * @param {Obejct} options
             * @returns {Object}
             */
            'defaultQuery' : function (options, searchString) {
                var orSelector,
                    selector = {},
                    field = options.field,
                    stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : '-i' };

                if (_.isString(field)) {
                    selector[field] = stringSelector;
                    return selector;
                }

                // Convert numbers if configured
                if (options.convertNumbers && parseInt(searchString, 10) == searchString) {
                    searchString = parseInt(searchString, 10);
                }

                // Should be an array
                selector['$or'] = [];

                _.each(field, function (fieldString) {
                    orSelector = {};
                    
                    if (_.isString(searchString)) {
                        orSelector[fieldString] = stringSelector;
                    } else if (_.isNumber(searchString)) {
                        orSelector[fieldString] = searchString;
                    }

                    selector['$or'].push(orSelector);
                });

                return selector;
            },
            /**
             * The default mongo-db sorting method used for sorting the results.
             *
             * @param {Object} options
             * @return array
             */
            'defaultSort' : function (options) {
                return options.field;
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

            check(newConfig, Object);

            config = _.extend(config, newConfig);
            ElasticSearchClient = new ElasticSearch.Client(config);
        },
        /**
         * Create a search index.
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            check(name, String);
            check(options, Object);

            options = _.extend(_.clone(defaultOptions), options);

            check(Searchers[options.use], Object);
            options.field = _.isArray(options.field) ? options.field : [options.field];
            indexes[name] = options;

            Searchers[options.use].createSearchIndex(name, options);
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

            check(name, String);
            check(searchString, String);
            check(options, Object);
            check(callback, Match.Optional(Function));

            if ("undefined" === typeof Searchers[searcherType]) {
                throw new Meteor.Error(500, "Couldnt search with the type: '" + searcherType + "'");
            }
            
            // If custom permission check fails
            if (_.isFunction(indexes[name].permission) 
                    && !indexes[name].permission(searchString)) {
                return { 'results' : [], 'total' : 0 };
            } else {
                return Searchers[searcherType].search(name, searchString, _.extend(indexes[name], options), callback);
            }
        },
        /**
         * Get the ElasticSearchClient
         * @see http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current
         *
         * @return {ElasticSearchInstance}
         */
        'getElasticSearchClient' : function () {
            return ElasticSearchClient;
        },
        /**
         * Retrieve a specific index configuration.
         *
         * @param {String} name
         * @return {Object}
         * @api public
         */
        'getIndex' : function (name) {
            return indexes[name];
        },
        /**
          * Retrieve all index configurations
          */
        'getIndexes' : function () {
            return indexes;
        },
        /**
         * Retrieve a specific Seacher.
         *
         * @param {String} name
         * @return {Object}
         * @api public
         */
        'getSearcher' : function (name) {
            return Searchers[name];
        },
        /**
         * Retrieve all Searchers
         */
        'getSearchers' : function () {
            return Searchers;
        },
        /**
         * Makes it possible to override or extend the different
         * types of search to use with EasySearch (the "use" property)
         * when using EasySearch.createSearchIndex()
         *
         * @param {String} key      Type, e.g. mongo-db, elastic-search
         * @param {Object} methods  Methods to be used, only 2 are required:
         *                          - createSearchIndex (name, options)
         *                          - search (name, searchString, [options, callback])
         */
        'extendSearch' : function (key, methods) {
            check(key, String);
            check(methods.search, Function);
            check(methods.createSearchIndex, Function);

            Searchers[key] = methods;
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
        check(name, String);
        check(searchString, String);
        check(options, Object);
        return EasySearch.search(name, searchString, options);
    }
});
