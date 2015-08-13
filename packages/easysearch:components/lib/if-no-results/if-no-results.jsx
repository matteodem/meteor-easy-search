/**
 * The IfNoResultsComponent lets you display content when there are no results.
 *
 * @type {IfNoResultsComponent}
 */
EasySearch.IfNoResultsComponent = class IfNoResultsComponent extends BaseComponent {
  /**
   * Return true if there are no results.
   *
   * @returns {boolean}
   */
  noResults() {
    let count = this.dict.get('count');
    return !_.isNumber(count) || 0 === count;
  }
};

EasySearch.IfNoResultsComponent.register('EasySearch.IfNoResults');
