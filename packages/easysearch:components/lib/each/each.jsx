/**
 * The EachComponent allows to loop through the search results found with the InputComponent.
 *
 * @type {EachComponent}
 */
EasySearch.EachComponent = class EachComponent extends BaseComponent {
  /**
   * Return the mongo cursor for the search.
   *
   * @returns {Mongo.Cursor}
   */
  doc() {
    let searchString = this.dict.get('searchString') || '',
      searchOptions = this.dict.get('searchOptions') || {};

    if (_.isString(searchString)) {
      let cursor = this.index.search(searchString, searchOptions);

      this.dict.set('count', cursor.count());
      this.dict.set('searching', !cursor.isReady());

      return cursor.mongoCursor;
    }
  }
};

EasySearch.EachComponent.register('EasySearch.Each');
