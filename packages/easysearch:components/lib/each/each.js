/**
 * The EachComponent allows to loop through the search results found with the InputComponent.
 *
 * @type {EachComponent}
 */
EasySearch.EachComponent = class EachComponent extends SingleIndexComponent {

  /**
   * Return the mongo cursor for the search.
   *
   * @returns {Mongo.Cursor}
   */
  doc() {
    return this.index
      .getComponentMethods(this.name)
      .getCursor()
      .mongoCursor
    ;
  }
};

EasySearch.EachComponent.register('EasySearch.Each');
