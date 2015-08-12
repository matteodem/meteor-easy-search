class EachComponent extends BaseComponent {
  // TODO: throw error if indexes=* is used
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
}

EachComponent.register('EasySearch.Each');
