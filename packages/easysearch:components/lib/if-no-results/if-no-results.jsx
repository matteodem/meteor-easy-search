class IfNoResultsComponent extends BaseComponent {

  noResults() {
    let count = this.dict.get('count');
    return _.isNumber(count) && 0 === count;
  }
}

IfNoResultsComponent.register('EasySearch.IfNoResults');
