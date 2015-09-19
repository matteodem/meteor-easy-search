// TODO: documentation: how to metaScore (fields and sort)
// TODO: Check for es6features again

/* TODO: as a reminder
   Possible options:

   Search options: limit, skip, props
   Index options: permission, collection, fields, engine
   Reactive Engine options: transform
   Mongo Engine options: selector, sort, weights
   ES Engine options: query, sort, mapping (ES)
*/
/**
 * An Index represents the main entry point for Searching with Easy-Search. It relies on
 * the given engine to have the search functionality and defines the data should be searchable.
 *
 * @type {Index}
 */
Index = class Index {
  /**
   * Constructor
   *
   * @param {Object} config Configuration
   *
   * @constructor
   */
  constructor(config) {
    check(config, Object);
    check(config.collection, Meteor.Collection);
    check(config.fields, [String]);

    if (!(config.engine instanceof Engine)) {
      throw new Meteor.Error('invalid-engine', 'engine needs to be instanceof Engine');
    }

    config.name = (config.collection._name  || '').toLowerCase();

    this.config = Object.assign(Index.defaultConfiguration, config);
    this.defaultSearchOptions = Object.assign({}, { limit: 10, skip: 0, props: {} }, this.config.defaultSearchOptions);

    // Engine specific code on index creation
    config.engine.onIndexCreate(this.config);
  }

  /**
   * Default configuration for an index.
   *
   * @returns {Object}
   */
  static get defaultConfiguration() {
    return {
      permission: () => true,
      defaultSearchOptions: () => {}
    };
  }

  /**
   * Search the index.
   *
   * @param {String} searchString Search string
   * @param {Object} options      Options
   *
   * @returns {Cursor}
   */
  search(searchString, options = {}) {
    check (searchString, Match.OneOf(Object, String));
    check(options, {
      limit: Match.Optional(Number),
      skip: Match.Optional(Number),
      props: Match.Optional(Object)
    });

    if (!this.config.permission()) {
      throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
    }

    return this.config.engine.search(searchString, {
      search: this.getSearchOptions(options),
      index: this.config
    });
  }

  /**
   * Returns the search options based on the given options.
   *
   * @param {Object} options Options to use
   *
   * @returns {Object}
   */
  getSearchOptions(options) {
    return Object.assign({}, this.defaultSearchOptions, options);
  }
};
