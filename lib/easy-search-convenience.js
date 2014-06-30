Meteor.Collection.prototype.initEasySearch = function (fields, limit, use) {
    var options = {
            'collection' : this,
            'field' : fields
        };

    if (null != limit) {
        options['limit'] = limit;
    }

    if (null != use) {
        options['use'] = use;
    }

    EasySearch.createSearchIndex(this._name, options);
};
