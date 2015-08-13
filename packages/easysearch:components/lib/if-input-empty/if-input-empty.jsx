/**
 * The IfInputEmptyComponent lets you display content when the input is empty.
 *
 * @type {IfInputEmptyComponent}
 */
EasySearch.IfInputEmptyComponent = class IfInputEmptyComponent extends BaseComponent {
  /**
   * Return true if the input is empty.
   *
   * @returns {boolean}
   */
  inputEmpty() {
    let searchString = this.dict.get('searchString');

    return !searchString || (_.isString(searchString) && 0 === searchString.trim().length);
  }
};

EasySearch.IfInputEmptyComponent.register('EasySearch.IfInputEmpty');
