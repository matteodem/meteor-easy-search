class EachComponent extends BaseComponent {
  doc() {
    let searchString = this.index
      .getComponentDict(this.name)
      .get('searchString')
    ;

    if (_.isString(searchString)) {
      return this.index.search(searchString).mongoCursor;
    }
  }
}

EachComponent.register('EasySearch.Each');
