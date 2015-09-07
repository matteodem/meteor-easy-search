/**
 * The LoadMoreComponent lets you load more documents through a button.
 *
 * @type {LoadMoreComponent}
 */
EasySearch.LoadMoreComponent = class LoadMoreComponent extends BaseComponent {

  /**
   * Load more documents.
   */
  loadMore() {
    // TODO: abstract logic into base component
    let dict = _.first(this.dicts);
    let currentCount = dict.get('currentCount');

    let options = dict.get('searchOptions') || {};

    options.limit = currentCount + this.options.count;

    dict.set('searchOptions', options);
  }

  /**
   * Content of the component.
   *
   * @returns string
   */
  content() {
    return this.options.content;
  }

  /**
   * Attributes of the component.
   *
   * @returns string
   */
  attributes() {
    return this.options.attributes;
  }

  /**
   * Return true if there are more documents to load.
   *
   * @returns {Boolean}
   */
  moreDocuments() {
    return _.first(this.dicts).get('currentCount') < _.first(this.dicts).get('count');
    // TODO: make throwing error in using "indexes" configurable
  }
  /**
   * Event map.
   *
   * @returns {Object}
   */
  events() {
    return [{
      'click button' : function (e) {
        this.loadMore();
      }
    }];
  }

  /**
   * Return the default options.
   *
   * @returns {Object}
   */
  get defaultOptions() {
    return {
      content: 'Load more',
      attributes: {},
      count: 10
    };
  }
};

EasySearch.LoadMoreComponent.register('EasySearch.LoadMore');
