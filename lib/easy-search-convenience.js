Meteor.Collection.prototype.initEasySearch = function (fields, options) {
    EasySearch.createSearchIndex(this._name, _.extend(options, {
        'collection' : this,
        'field' : fields
    }));
};
