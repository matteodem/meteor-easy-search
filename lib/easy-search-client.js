EasySearch = function () {
    'use strict';

    var defaults = {
            limit: 10,
            exact: false,
            caseSensitive: false
        },
        indexes = {};

    return {
        /**
         * Create a search "index" to search on.
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            indexes[name] = _.extend(defaults, options);
            indexes[name].defaultLimit = options.limit;
        },
        /**
         * Search over one of the defined indexes.
         *
         * @param {String} name
         * @param {String} searchString
         * @param {Function} callback
         */
        'search' : function (name, searchString, callback) {
            Meteor.call('easySearch', name, searchString, _.omit(indexes[name], 'collection'), callback);
        },
        /**
         * Search over multiple indexes.
         *
         * @param {array} indexes
         * @param {String} searchString
         * @param {Function} callback
         */
        'searchMultiple' : function (indexes, searchString, callback) {
            _.each(indexes, function (name) {
                Meteor.call('easySearch', name, searchString, callback);
            });
        },
        /**
         * Allow easily changing properties (for example the global search fields).
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
        },
        /*
         * Retrieve a specific index configuration.
         *
         * @return {object}
         */
        'getIndex' : function (name) {
            return indexes[name];
        },
        /**
          * Retrieve all index configurations
          *
          * @return array
          */
        'getIndexes' : function () {
            return indexes;
        }
    };
}();
