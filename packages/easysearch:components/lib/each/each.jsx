class EachComponent extends BaseComponent {
  doc() {
    let searchString = this.dict.get('searchString');

    if (_.isString(searchString)) {
      let cursor = this.index.search(searchString);

      this.dict.set('count', cursor.count());
      this.dict.set('searching', !cursor.isReady());

      return cursor.mongoCursor;
    }
  }
}

EachComponent.register('EasySearch.Each');
