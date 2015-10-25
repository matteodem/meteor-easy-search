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

    options = {
      search: this._getSearchOptions(options),
      index: this.config
    };

    if (!this.config.permission(options.search)) {
      throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
    }

    return this.config.engine.search(searchDefinition, options);
  }

  /**
   * Returns the search options based on the given options.
   *
   * @param {Object} options Options to use
   *
   * @returns {Object}
   */
  _getSearchOptions(options) {
    return _.defaults(( Meteor.userId ? { userId: Meteor.userId() } : {} ), options, this.defaultSearchOptions);
  }
};
