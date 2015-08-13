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
    // TODO: support for several indexes (indexes=*)
    let index = this.getData().index;

    if (!(index instanceof EasySearch.Index)) {
      throw new Meteor.Error('no-index', 'Please provide an index for your component');
    }

    this.index = index;
    this.options = Object.assign({}, this.defaultOptions, this.getData().options);

    check(this.name, Match.Optional(String));
    check(this.options, Object);

    if (!this.dict) {
      this.index.registerComponent(this.name);
    }
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
    this.dict.set('searchString', searchString);
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
   * Return the dictionary.
   *
   * @returns {Object}
   */
  get dict() {
    return this.index.getComponentDict(this.name);
  }
};

EasySearch.BaseComponent = BaseComponent;
