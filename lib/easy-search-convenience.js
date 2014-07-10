Meteor.Collection.prototype.initEasySearch = function (fields, options) {
    if (!_.isObject(options)) {
        options = {};
    }

    EasySearch.createSearchIndex(this._name, _.extend(options, {
        'collection' : this,
        'field' : fields
    }));
};
