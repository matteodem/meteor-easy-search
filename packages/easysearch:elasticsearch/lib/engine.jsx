if (Meteor.isServer) {
  var Future = Npm.require('fibers/future'),
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
    this.extendDefaultConfiguration(ElasticSearchEngine.defaultElasticsearchConfiguration());
    super(...arguments);
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
       * @returns {Array}
       */
      fieldsToIndex: function (options) {
        return [];
      },
      /**
       * The ES query object used for searching the results.
       *
       * @param {String} searchString Search string
       * @param {Object} options      Search options
       *
       * @return array
       */
      query(searchString, options) {
        return {
          "fuzzy_like_this" : {
            "fields" : options.index.fields,
            "like_text" : searchString
          }
        };
      },
      /**
       * The ES sorting method used for sorting the results.
       *
       * @param {String} searchString Search string
       * @param {Object} options      Search options
       *
       * @return array
       */
      sort(searchString, options) {
        return options.index.fields;
      },
      /**
       * Return the ElasticSearch document to index.
       *
       * @param {Object} doc    Document to index
       * @param {Array}  fields Array of document fields
       */
      getElasticSearchDoc(doc, fields) {
        if (_.isEmpty(fields)) {
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
        indexName: 'easysearch',
        indexType: indexConfig.name,
        collection: indexConfig.collection,
        client: indexConfig.elasticSearchClient,
        beforeIndex: (doc) => this.config.getElasticSearchDoc(doc, this.config.fieldsToIndex(indexConfig))
      });
    }
  }

  /**
   * Return the reactive search cursor.
   *
   * @param {String} searchString String to search for
   * @param {Object} options      Search and index options
   */
  getSearchCursor(searchString, options) {
    let fut = new Future(),
      body = {};

    body.query = this.config.query(searchString, options);
    body.sort = this.config.sort(searchString, options);
    body.fields = ['_id'];

    body = this.config.body(body);

    options.index.elasticSearchClient.search({
      index: 'easysearch',
      type: options.index.name,
      body: body,
      size: options.search.limit,
      from: options.search.skip
    }, (error, data) => {
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
            return { _id };
          })
        }, { limit: options.search.limit });
      } else {
        cursor = EasySearch.Cursor.emptyCursor;
      }

      fut['return'](new EasySearch.Cursor(cursor, total));
    });

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
      ids : _.map(data.hits.hits, (resultSet) => resultSet._id),
      total: data.hits.total
    };
  }
};
