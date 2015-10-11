// TODO: docs, don't forget __originalId
// TODO: CHANGELOG.md and UPGRADE-2.0.md
// TODO: release process (+ README for each package)

/**
 * An Index represents the main entry point for searching with EasySearch. It relies on
 * the given engine to have the search functionality and defines the data that should be searchable.
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

    this.config = _.assign(Index.defaultConfiguration, config);
    this.defaultSearchOptions = _.defaults({}, this.config.defaultSearchOptions, { limit: 10, skip: 0, props: {} });

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
   * @param {Object|String} searchDefinition Search definition
   * @param {Object}        options          Options
   *
   * @returns {Cursor}
   */
  search(searchDefinition, options = {}) {
    this.config.engine.checkSearchParam(searchDefinition, this.config);

    check(options, {
      limit: Match.Optional(Number),
      skip: Match.Optional(Number),
      props: Match.Optional(Object)
    });

    if (!this.config.permission()) {
      throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
    }

    return this.config.engine.search(searchDefinition, {
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
    return _.defaults({}, options, this.defaultSearchOptions);
  }
};
