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
      if (this.index)  {
    let stopPublication = this.index
      .getComponentDict(this.name)
      .get('stopPublication')
    ;

    this.cursor && stopPublication && this.cursor.stop();

    this.cursor = this.index
        .getComponentMethods(this.name)
        .getCursor()
    ;

    return this.cursor.mongoCursor;
      }
      else { return null }
  }
};

EasySearch.EachComponent.register('EasySearch.Each');
