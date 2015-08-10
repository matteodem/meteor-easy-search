const DEFAULT_NAME = '__default';

EasySearch.Index.prototype.components = {};

EasySearch.Index.prototype.registerComponent = function (componentName = DEFAULT_NAME) {
  this.components[componentName] = new ReactiveDict(`easySearchComponent_${this.config.name}_${componentName}`);
};

EasySearch.Index.prototype.getComponentDict = function (componentName = DEFAULT_NAME) {
  return this.components[componentName];
};
