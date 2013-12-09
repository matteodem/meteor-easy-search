EasySearch = function () {
    'use strict';

    // TODO: Wrappers around searchboxes, which handle searching:
    /*
        {{#easySearchWrapper 'cars' }}
            <input type="text" />
        {{/easySearchWrapper}}
    */
    // TODO: Listing search results with a custom each:
    // Also before and after hooks somehow..
    /*
     {{#easySearchList 'cars' }}
        // returns all fields in the this scope
     {{/easySearchList}}
     */

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
        'search' : function (name, searchString, callback) {
            Meteor.call('easySearch', name, searchString, callback);
        },
        /**
         * Allow easily changing properties, for example limiting
         *
         * @param {String} name
         * @param {String} key
         * @param {Object} value
         */
        'changeProperty' : function(name, key, value) {
            // TODO: Meteor.call
        }
    };
}();