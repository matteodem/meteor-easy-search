/**
 * The InputComponent lets you search through configured indexes.
 *
 * @type {InputComponent}
 */
EasySearch.InputComponent = class InputComponent extends BaseComponent {
  /**
   * Setup input onCreated
   */
  onCreated() {
    super.onCreated(...arguments);

    this.search('');

    this.debouncedSearch = _.debounce((searchString) => {
      searchString = searchString.trim();

      if (this.searchString !== searchString) {
        this.dict.set('searching', true);
        this.searchString = searchString;
        this.search(searchString);
      }

    }, this.options.timeout);
  }

  /**
   * Event map
   *
   * @returns {Object}
   */
  events() {
    return [{
      'keyup input' : function (e) {
        this.debouncedSearch($(e.target).val());
      }
    }];
  }

  /**
   * Return the attributes to set on the input (class, id)
   *
   * @returns {Object}
   */
  inputAttributes() {
    return Object.assign({}, InputComponent.defaultAttributes, this.getData().attributes);
  }

  /**
   * Return the default attributes.
   *
   * @returns {Object}
   */
  static get defaultAttributes() {
    return {
      type: 'text'
    };
  }

  /**
   * Return the default options.
   *
   * @returns {Object}
   */
  get defaultOptions() {
    return {
      timeout: (this.index.config.engine instanceof EasySearch.Minimongo) ? 20 : 200
    };
  }
};

EasySearch.InputComponent.register('EasySearch.Input');
