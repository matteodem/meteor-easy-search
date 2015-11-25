EasySearch._getComponentMethods = function (dict, index) {
  return {
    /**
     * Search a component for the given search string.
     *
     * @param {Object|String} searchDefinition Search definition
     */
    search: (searchDefinition) => {
      dict.set('searchOptions', {
        props: (dict.get('searchOptions') || {}).props
      });

      dict.set('searchDefinition', searchDefinition);
      dict.set('stopPublication', true);
    },
    /**
     * Return the EasySearch.Cursor for the current search.
     *
     * @returns {Cursor}
     */
    getCursor: () => {
      let searchDefinition = dict.get('searchDefinition') || '',
        options = dict.get('searchOptions');

      check(options, Match.Optional(Object));

      let cursor = index.search(searchDefinition, options),
        searchOptions = index._getSearchOptions(options);

      dict.set('count', cursor.count());
      dict.set('searching', !cursor.isReady());
      dict.set('limit', searchOptions.limit);
      dict.set('skip', searchOptions.skip);
      dict.set('currentCount', cursor.mongoCursor.count());
      dict.set('stopPublication', false);

      return cursor;
    },
    /**
     * Return true if the current search string is empty.
     *
     * @returns {boolean}
     */
    searchIsEmpty: () => {
      let searchDefinition = dict.get('searchDefinition');

      return !searchDefinition || (_.isString(searchDefinition) && 0 === searchDefinition.trim().length);
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
     * Return true if the component has more documents than displayed right now.
     *
     * @returns {boolean}
     */
    hasMoreDocuments: () => {
      return dict.get('currentCount') < dict.get('count');
    },
    /**
     * Load more documents for the component.
     *
     * @param {Number} count Count of docs
     */
    loadMore: (count) => {
      check(count, Number);

      let currentCount = dict.get('currentCount'),
        options = dict.get('searchOptions') || {};

      options.limit = currentCount + count;
      dict.set('searchOptions', options);
    },
    /**
     * Paginate through documents for the given page.
     *
     * @param {Number} page Page number
     */
    paginate: (page) => {
      check(page, Number);

      let options = dict.get('searchOptions') || {},
        limit = dict.get('limit');

      options.skip = limit * (page - 1);
      dict.set('searchOptions', options);
      dict.set('stopPublication', true);
    },
    /**
     * Add custom properties for search.
     */
    addProps: (...args) => {
      let options = dict.get('searchOptions') || {};

      options.props = options.props || {};

      if (_.isObject(args[0])) {
        options.props = _.extend(options.props, args[0]);
      } else if (_.isString(args[0])) {
        options.props[args[0]] = args[1];
      }

      dict.set('searchOptions', options);
    },
    /**
     * Remove custom properties for search.
     */
    removeProps: (...args) => {
      let options = dict.get('searchOptions') || {};

      if (!_.isEmpty(args)) {
        options.props = _.omit(options.props, args) || {};
      } else {
        options.props = {};
      }

      dict.set('searchOptions', options);
    }
  };
};
