/**
 * An Engine is the technology used for searching with Easy-Search, with
 * customizable configuration to how it interacts with the data from the Index.
 *
 * @type {Engine}
 */
Engine = class Engine {

  /**
   * Constructor
   *
   * @param {Object} config configuration
   *
   * @constructor
   */
  constructor(config = {}) {
    if (this.constructor === Engine) {
      throw new Error('Cannot initialize instance of Engine');
    }

    if (!_.isFunction(this.search)) {
      throw new Error('Engine needs to implement search method');
    }

    this.config = Object.assign({}, this.defaultConfiguration, config);
  }

  /**
   * Extend default configuration with custom configuration for engines.
   *
   * @param {Object} config Additional default configuration
   */
  extendDefaultConfiguration(config) {
    check(config, Object);
    this.__defaultConfiguration = Object.assign({}, this.defaultConfiguration, config);
  }

  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  get defaultConfiguration() {
    return this.__defaultConfiguration;
  }

  /**
   * Call a configuration method with the engine scope.
   *
   * @param {String} methodName Method name
   * @param {Object} args       Arguments for the method
   *
   * @returns {*}
   */
  callConfigMethod(methodName, ...args) {
    check(methodName, String);
    return this.config[methodName].apply(this, args);
  }

  /**
   * Placeholder onIndexCreate function
   */
  onIndexCreate() {}
};
