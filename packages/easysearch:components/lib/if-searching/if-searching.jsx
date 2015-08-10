class IfSearchingComponent extends BaseComponent {

  searching() {
    return !!this.dict.get('searching');
  }
}

IfSearchingComponent.register('EasySearch.IfSearching');
