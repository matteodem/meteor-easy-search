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
    var id,
      input = $(this);

    if (input.prop("tagName") !== 'INPUT') {
      return [];
    }

    id = EasySearch.Components.generateId(input.parent().data('index'), input.parent().data('id'));

    return EasySearch.Components.Variables.get(id, 'autosuggestSelected');
  }
}

