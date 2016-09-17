/**
 * The EachComponent allows to loop through the search results found.
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
    const stopPublication = this.index
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
};

EasySearch.EachComponent.register('EasySearch.Each');
