EasySearch = function () {
    'use strict';

    var indexes = {
            /*
            collection: Meteor.Collection (required),
            field: [string] || string (required),
            limit: number (default: 10),
            exact: boolean (default false)
            caseSensitive: boolean (default false)
            */
        };

    return {
        /**
         * Create a search "index" to search on.
         *
         * @param {String} name
         * @param {Object} options
         */
        'createSearchIndex' : function (name, options) {
            indexes[name] = options;
        },
        /**
         * Search over one of the defined indexes.
         *
         * @param {String} name
         * @param {String} searchString
         * @param {Function} callback
         */
        'search' : function (name, searchString, callback) {
            Meteor.call('easySearch', name, searchString, callback);
        },
        /**
         * Allow easily changing properties, for example limiting.
         *
         * @param {String} name
         * @param {String} key
         * @param {Object} value
         */
        'changeProperty' : function(name, key, value) {
            Meteor.call('easySearchChangeProperty', name, key, value);
        },
        /**
          * Retrieve all index configurations
          */
        'getIndexes' : function () {
            return indexes;
        }
    };
}();
