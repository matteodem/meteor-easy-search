/**
 * Extend EasySearch.Index with component functionality.
 *
 * @type {Index}
 */
EasySearch.Index = class Index extends EasySearch.Index {
  /**
   * Constructor.
   */
  constructor() {
    this.components = {};
    super(...arguments);
  }

  /**
   * Return static default name for components.
   *
   * @returns {string}
   */
  static get COMPONENT_DEFAULT_NAME() {
    return'__default';
  }

  /**
   * Register a component on the index.
   *
   * @param {String} componentName Optional name of the component
   */
  registerComponent(componentName = EasySearch.Index.COMPONENT_DEFAULT_NAME) {
    this.components[componentName] = new ReactiveDict(`easySearchComponent_${this.config.name}_${componentName}_${Random.id()}`);
  }

  /**
   * Get the reactive dictionary for a component.
   *
   * @param {String} componentName Optional name of the component
   */
  getComponentDict(componentName = EasySearch.Index.COMPONENT_DEFAULT_NAME) {
    return this.components[componentName];
  }

  /**
   * Get component methods that are useful for implementing search behaviour.
   *
   * @param componentName
   */
  getComponentMethods(componentName = EasySearch.Index.COMPONENT_DEFAULT_NAME) {
    let dict = this.getComponentDict(componentName);

    if (!dict) {
      throw new Meteor.Error('no-component', `Component with name '${componentName}' not found`);
    }

    return {
      /**
       * Search a component for the given search string.
       *
       * @param {String} searchString String to search for
       */
      search: (searchString) => {
        check(searchString, String);

        dict.set('searching', searchString.length > 0);
        dict.set('searchOptions', {});
        dict.set('searchString', searchString);
      },
      /**
       * Return the EasySearch.Cursor for the current search.
       *
       * @returns {Cursor}
       */
      getCursor: () => {
        let searchString = dict.get('searchString') || '',
          searchOptions = dict.get('searchOptions');

        check(searchString, String);
        check(searchOptions, Match.Optional(Object));

        let cursor = this.search(searchString, searchOptions);

        dict.set('count', cursor.count());
        dict.set('searching', !cursor.isReady());
        dict.set('currentCount', cursor.mongoCursor.count());

        return cursor;
      },
      /**
       * Return true if the current search string is empty.
       *
       * @returns {boolean}
       */
      searchIsEmpty: () => {
        let searchString = dict.get('searchString');

        return !searchString || (_.isString(searchString) && 0 === searchString.trim().length);
      },
      /**
       * Return true if the component has no results.
       *
       * @returns {boolean}
       */
      hasNoResults: () => {
        let count = dict.get('count');

        return !_.isNumber(count) || 0 === count;
      },
      /**
       * Return true if the component is being searched.
       *
       * @returns {boolean}
       */
      isSearching: () => {
        return !!dict.get('searching');
      },
      /**
       * Load more documents for the component.
       *
       * @param {Number} count Count of docs
       */
      loadMore: (count) => {
        let currentCount = dict.get('currentCount'),
          options = dict.get('searchOptions') || {};

        options.limit = currentCount + count;
        dict.set('searchOptions', options);
      }
    };
  }
};

