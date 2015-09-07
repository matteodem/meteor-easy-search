/**
 * The EachComponent allows to loop through the search results found with the InputComponent.
 *
 * @type {EachComponent}
 */
EasySearch.EachComponent = class EachComponent extends BaseComponent {

  onCreated() {
    if (!_.isEmpty(this.getData().indexes)) {
      throw new Meteor.Error('only-single-index', 'Can only specify one index');
    }

    super.onCreated();
  }

  /**
   * Return the mongo cursor for the search.
   *
   * @returns {Mongo.Cursor}
   */
  doc() {
    let dict = _.first(this.dicts),
      searchString = dict.get('searchString') || '',
      searchOptions = dict.get('searchOptions') || {};

    if (_.isString(searchString)) {
      let cursor = _.first(this.indexes).search(searchString, searchOptions);

      dict.set('count', cursor.count());
      dict.set('searching', !cursor.isReady());
      dict.set('currentCount', cursor.mongoCursor.count());

      return cursor.mongoCursor;
    }
  }
};

EasySearch.EachComponent.register('EasySearch.Each');
