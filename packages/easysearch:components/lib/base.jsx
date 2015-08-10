BaseComponent = class BaseComponent extends BlazeComponent {

  get name() {
    return this.getData().name;
  }

  onCreated() {
    let index = this.getData().index;

    if (!(index instanceof EasySearch.Index)) {
      throw new Meteor.Error('no-index', 'Please provide an index for your component');
    }

    this.index = index;

    if (!this.index.getComponentDict(this.name)) {
      this.index.registerComponent(this.name);
    }
  }

  search(searchString) {
    this.index
      .getComponentDict(this.name)
      .set('searchString', searchString)
    ;
  }

  getData() {
    return (this.data() || {});
  }
};
