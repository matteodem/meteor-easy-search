/**
 * The BaseComponent holds the base logic for EasySearch Components.
 *
 * @type {BaseComponent}
 */
BaseComponent = class BaseComponent extends BlazeComponent {
  /**
   * Return the name of the component.
   *
   * @returns {String}
   */
  get name() {
    return this.getData().name;
  }

  /**
   * Setup component on created.
   */
  onCreated() {
    let index = this.getData().index,
      indexes = [index];

    if (!index) {
      indexes = this.getData().indexes;
    }

    if (_.isEmpty(indexes)) {
      throw new Meteor.Error('no-index', 'Please provide an index for your component');
    }

    this.indexes = indexes;
    this.options = Object.assign({}, this.defaultOptions, this.getData().options);

    check(this.name, Match.Optional(String));
    check(this.options, Object);

    this.eachIndex(function () {
      if (!this.dict) {
        this.index.registerComponent(this.name);
      }
    });
  }

  /**
   * Return the default options.
   *
   * @returns {Object}
   */
  get defaultOptions () {
    return {};
  }

  /**
   * Search the component.
   *
   * @param {String} searchString String to search for
   */
  search(searchString) {
    check(searchString, String);

    this.eachIndex(function () {
      this.dict.set('searchString', searchString);
    });
  }

  /**
   * Return the data.
   *
   * @returns {Object}
   */
  getData() {
    return (this.data() || {});
  }

  /**
   * Return the dictionaries.
   *
   * @returns {Object}
   */
  get dicts() {
    return _.map(this.indexes, (index) => {
      return index.getComponentDict(this.name);
    });
  }

  /**
   * Loop through each index and apply a function
   *
   * @param {Function} func   Function to run
   * @param {String}   method Lodash method name
   *
   * @return mixed
   */
  eachIndex(func, method = 'each') {
    let componentScope = this,
      logic = this.getData().logic;

    if (!_.isEmpty(logic)) {
      method = 'OR' === logic ? 'some' : 'every';
    }

    return _[method](this.indexes, function (index) {
      return func.apply({ index, dict: index.getComponentDict(componentScope.name), name: componentScope.name });
    });
  }
};

EasySearch.BaseComponent = BaseComponent;
