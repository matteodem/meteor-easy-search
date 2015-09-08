// TODO: test if components can re-use same index for multiple search components (on the same page)
// TODO: leverage logic from components into js API?
// TODO: Check for es6features again
// TODO: MIGRATING.MD
// TODO: documentation: how to metaScore (fields and sort)

/* TODO: as a reminder
   Possible options:

   Search options: limit, offset, props
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

    config.name = config.collection._name;

    this.config = Object.assign(Index.defaultConfiguration, config);
    this.defaultSearchOptions = Object.assign({}, { limit: 10, offset: 0 }, this.config.defaultSearchOptions);

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
    check(options, Object);

    if (!this.config.permission()) {
      throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
    }

    return this.config.engine.search(searchString, {
      search: Object.assign({}, this.defaultSearchOptions, options),
      index: this.config
    });
  }
};
