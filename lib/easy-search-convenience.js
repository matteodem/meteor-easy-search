Meteor.Collection.prototype.initEasySearch = function (fields, options) {
  if (!_.isObject(options)) {
    options = {};
  }

  EasySearch.createSearchIndex(this._name, _.extend(options, {
    'collection' : this,
    'field' : fields
  }));
};

if (Meteor.isClient) {
    jQuery.fn.esAutosuggestData = function () {
        var input = $(this);

        if (input.prop("tagName").toUpperCase() !== 'INPUT') {
            return [];
        }

        return EasySearch.getComponentInstance({'id': input.parent().data('id'), 'index': input.parent().data('index')}).get('autosuggestSelected');
    }
}
