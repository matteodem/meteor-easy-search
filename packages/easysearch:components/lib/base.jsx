BaseComponent = class BaseComponent extends BlazeComponent {

  get name() {
    return this.getData().name;
  }

  onCreated() {
    // TODO: write tests that ensure that current logic works
    // TODO: add docs for components
    // TODO: support for several indexes (indexes=*)
    let index = this.getData().index;

    if (!(index instanceof EasySearch.Index)) {
      throw new Meteor.Error('no-index', 'Please provide an index for your component');
    }

    this.index = index;
    this.options = Object.assign({}, this.defaultOptions, this.getData().options);

    if (!this.dict) {
      this.index.registerComponent(this.name);
    }
  }

  get defaultOptions () {
    return {};
  }

  search(searchString) {
    this.dict.set('searchString', searchString);
  }

  getData() {
    return (this.data() || {});
  }

  get dict() {
    return this.index.getComponentDict(this.name);
  }
};
