/**
 * The IfSearchingComponent lets you display content when the component is being searched.
 *
 * @type {IfSearchingComponent}
 */
EasySearch.IfSearchingComponent = class IfSearchingComponent extends BaseComponent {
  /**
   * Return true if the component is being searched.
   *
   * @returns {boolean}
   */
  searching() {
    return !!this.eachIndex(function () {
      return !!this.dict.get('searching');
    }, 'every');
  }
};

EasySearch.IfSearchingComponent.register('EasySearch.IfSearching');
