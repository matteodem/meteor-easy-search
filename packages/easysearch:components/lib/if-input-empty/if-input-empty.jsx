class IfInputEmptyComponent extends BaseComponent {

  inputEmpty() {
    let searchString = this.dict.get('searchString');

    return !searchString || (_.isString(searchString) && 0 === searchString.trim().length);
  }
}

IfInputEmptyComponent.register('EasySearch.IfInputEmpty');
