EasySearch = function () {
    'use strict';

    var indexes = {
            /*
            collection: Meteor.Collection (required),
            field: [string] || string (required),
            limit: number (default: 10),
            exact: boolean (default false)
            */
        },
        /**
         * Get the valid mongodb selector of an index
         *
         * @param {Object} index
         * @param {String} searchString
         * @returns {Object}
         */
        getSelector = function (index, searchString) {
            var orSelector,
                selector = {},
                field = index.field,
                stringSelector = index.exact ? searchString : { '$regex' : '.*' + searchString + '.*' };

            if (_.isString(field)) {
                selector[field] = stringSelector;
                return selector;
            }

            // Should be an array
            selector['$or'] = [];

            _.each(field, function (fieldString) {
                orSelector = {};
                orSelector[fieldString] = stringSelector;

                selector['$or'].push(orSelector);
            });

            return selector;
        };

    return {
        /**
         * Create a search "index" to search on
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            indexes[name] = options;
        },
        /**
         * Search over one of the defined indexes
         * @param {String} name
         * @param {String} searchString
         */
        'search' : function (name, searchString) {
            var selector,
                index = indexes[name];

            if (!index) {
                throw new Meteor.Error("Didn\t find the Search Index called: " + name);
            }

            index.limit = index.limit || 10;
            index.exact = index.exact || false;

            // if several, fields do an $or search, otherwise only over the field
            selector = getSelector(index, searchString);

            return index.collection.find(selector, { 'limit' : index.limit });
        },
        /**
         * Allow easily changing properties, for example limiting
         *
         * @param {String} name
         * @param {String} key
         * @param {Object} value
         */
        'changeProperty' : function(name, key, value) {
            if (!_.isString(name) || !_.isString(key)) {
                throw new Meteor.Error('name and key of the property have to be strings!');
            }

            indexes[name][key] = value;
        }
    };
}();