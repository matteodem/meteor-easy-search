if (Meteor.isServer) {
    var Future        = Npm.require('fibers/future'),
        elasticsearch = Npm.require('elasticsearch');
}

/**
 * The ElasticsearchEngine lets you search documents through an Elasticsearch Index.
 *
 * @type {ElasticSearchEngine}
 */
EasySearch.ElasticSearch = class ElasticSearchEngine extends EasySearch.ReactiveEngine {
    /**
     * Constructor.
     */
    constructor() {
        super(...arguments);
    }

    /**
     * Return default configuration.
     *
     * @returns {Object}
     */
    defaultConfiguration() {
        return _.defaults({}, ElasticSearchEngine.defaultElasticsearchConfiguration(), super.defaultConfiguration());
    }

    /**
     * Default configuration.
     *
     * @returns {Object}
     */
    static defaultElasticsearchConfiguration() {
        return {
            /**
             * Return the fields to index in ElasticSearch.
             *
             * @param {Object} options Index options
             *
             * @returns {null|Array}
             */
                fieldsToIndex(options) {
                return null;
            },
            /**
             * The ES query object used for searching the results.
             *
             * @param {Object} searchObject Search object
             * @param {Object} options      Search options
             *
             * @return array
             */
                query(searchObject, options) {
                let query = {
                    bool: {
                        should: []
                    }
                };

                _.each(searchObject, function (searchString, field) {
                    query.bool.should.push({
                        "fuzzy_like_this": {
                            "fields": [field],
                            "like_text": searchString
                        }
                    });
                });

                return query;
            },
            /**
             * The ES sorting method used for sorting the results.
             *
             * @param {Object} searchObject Search object
             * @param {Object} options      Search options
             *
             * @return array
             */
                sort(searchObject, options) {
                return options.index.fields;
            },
            /**
             * Return the ElasticSearch document to index.
             *
             * @param {Object} doc    Document to index
             * @param {Array}  fields Array of document fields
             */
                getElasticSearchDoc(doc, fields) {
                if (null === fields) {
                    return doc;
                }

                let partialDoc = {};

                _.each(fields, function (field) {
                    if (_.has(doc, field)) {
                        partialDoc[field] = _.get(doc, field);
                    }
                });

                return partialDoc;
            },
            /**
             * Return the elastic search body.
             *
             * @param {Object} body Existing ES body
             *
             * @return {Object}
             */
            body: (body) => body,
            /**
             * Default ES client configuration.
             */
            client: {
                host: 'localhost:9200'
            }
        };
    }

    /**
     * Act on index creation.
     *
     * @param {Object} indexConfig Index configuration
     */
    onIndexCreate(indexConfig) {
        super.onIndexCreate(indexConfig);

        if (Meteor.isServer) {
            indexConfig.elasticSearchClient = new elasticsearch.Client(this.config.client);
            indexConfig.elasticSearchSyncer = new ElasticSearchDataSyncer({
                indexName: indexConfig.indexName || 'easysearch',
                indexType: indexConfig.indexType || indexConfig.name, //indexConfig.name,
                collection: indexConfig.collection,
                client: indexConfig.elasticSearchClient,
                beforeIndex: (doc) => this.callConfigMethod('getElasticSearchDoc', doc, this.callConfigMethod('fieldsToIndex', indexConfig))
            });
        }
    }

    /**
     * Return the reactive search cursor.
     *
     * @param {Object} searchDefinition Search definition
     * @param {Object} options          Search and index options
     */
    getSearchCursor(searchDefinition, options) {
        let fut  = new Future(),
            body = {};

        searchDefinition = EasySearch.MongoDB.prototype.transformSearchDefinition(searchDefinition, options);

        body.query  = this.callConfigMethod('query', searchDefinition, options);
        body.sort   = this.callConfigMethod('sort', searchDefinition, options);
        body.fields = ['_id'];

        body = this.callConfigMethod('body', body);

        options.index.elasticSearchClient.search({
            indexName: options.index.indexName || 'easysearch',
            indexType: options.index.indexType || indexConfig.name, //indexConfig.name,
            body: body,
            size: options.search.limit,
            from: options.search.skip
        }, Meteor.BindEnvironment(function(error, data) {
            if (error) {
                console.log('Had an error while searching!');
                console.log(error);
                return;
            }

            let { total, ids } = this.getCursorData(data),
                cursor;

            if (ids.length > 0) {
                cursor = options.index.collection.find({
                    $or: _.map(ids, (_id) => {
                        return {_id};
                    })
                }, {limit: options.search.limit});
            }
            else {
                cursor = EasySearch.Cursor.emptyCursor;
            }

            fut['return'](new EasySearch.Cursor(cursor, total));
        }));

        return fut.wait();
    }

    /**
     * Get data for the cursor from the elastic search response.
     *
     * @param {Object} data ElasticSearch data
     *
     * @returns {Object}
     */
    getCursorData(data) {
        return {
            ids: _.map(data.hits.hits, (resultSet) => resultSet._id),
            total: data.hits.total
        };
    }
};
