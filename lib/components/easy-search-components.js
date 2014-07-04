(function () {
    'use strict';

    var m = {},
        defaults,
        LocalTimer,
        inputCache,
        SearchVars,
        LocalCache = new Meteor.Collection(null);

    // Default values
    defaults = {
        'inputTimeout' : 200,
        'reactive' : true,
        'event' : 'keyup'
    };

    // Session Abstraction
    Session.setDefault('esVariables', {});

    SearchVars = {
        'set' : function (id, obj) {
            Session.set('esVariables_' + id, _.extend(Session.get('esVariables_'  + id) || {}, obj));
        },
        'get' : function (id, key) {
            return (Session.get('esVariables_' + id) || {})[key];
        }
    };

    // TODO: Add missing components!
    // TODO: Tests
    // TODO: New version 1.0.0 http://semver.org/

    // Error Messages
    m.specifyIndex = 'Specify an index, for example {{> esInput index="name"}}!';

    // A simple timer
    LocalTimer = {
        'timers' : {},
        'stop' : function (id) {
            clearTimeout(this.timers[id]);
            delete this.timers[id];
        },
        'runAt' : function (id, millSec, func, params) {
            var that = this;

            this.timers[id] = setTimeout(function () {
                func(params);
                that.stop(id);
            }, parseInt(millSec, 10));
        },
        'isRunning' : function (id) {
            return "undefined" !== typeof this.timers[id];
        }
    };

    // Add the search results to cache and process it
    function processSearchResults(index, data, isReactive)
    {
        // Just store the data
        if (!isReactive) {
            LocalCache.upsert(
                { _id : index },
                { _id : index, r : isReactive, d : data.results }
            );

            return;
        }

        // If it has to be reactive
        LocalCache.upsert(
            { _id : index },
            {
                _id : index,
                r : isReactive,
                d : _.map(data.results, function(doc) { return doc._id; })
            }
        );
    }

    // Perform a search with esInput
    function esInputSearch (conf) {
        var id = conf.easySearchID,
            searchValue = conf.value,
            index = conf.easySearchIndex;

        if (searchValue.length < 1) {
            SearchVars.set(id, { 'searching' : false, 'searchingDone' : false });
            LocalCache.upsert({ _id : index }, { _id : index, d : null });
            return;
        }

        EasySearch.search(index, searchValue, function (err, data) {
            if (err) {
                throw new Meteor.Error(500, "Searching failed");
            }

            inputCache[id] = searchValue;
            SearchVars.set(id, {
                'searching' : false,
                'total' : data.total,
                'searchingDone' : true,
                'currentValue' : searchValue
            });
            processSearchResults(index, data, conf.easySearchReactive);
        });
    }

    // Generate an id used for the components
    function generateId(index, id) {
        var generatedId = index;

        if (!generatedId) {
            throw new Meteor.Error(400, m.specifyIndex);
        }

        if (id) {
            generatedId += '_' + id;
        }

        return generatedId;
    }

    /* esInput */

    Template.esInput.events({
        'keyup input' : function (e) {
            var i, id, index,
                searchValue,
                eventScope = this,
                input = $(e.target),
                reactive = this.reactive !== "false",
                timeout = this.timeout || defaults.inputTimeout,
                event = this.event || defaults.event,
                searchValue = input.val().trim(),
                keyCode = e.keyCode || e.which;

            // Pressed not enter with enter configuration
            if ("enter" === event && 13 !== keyCode) {
                return;
            }

            if (!_.isArray(this.index)) {
                this.index = [this.index];
            }

            // Reset values if search value is empty
            if (searchValue.length === 0) {
                _.each(this.index, function (index) {
                    var id = generateId(index, eventScope.id);
                    SearchVars.set(id, { 'searchingDone' : false });
                    SearchVars.set(id, { 'searching' : true });
                });

                return;
            }

            // Only search when the value hasn't changed
            if (inputCache === searchValue) {
                return;
            }

            // Run the search at the specified timeout
            inputCache = searchValue;

            _.each(this.index, function (index) {
                id = generateId(index, eventScope.id);
                SearchVars.set(id, { 'searching' : false });

                // If already running, stop the timer
                if (LocalTimer.isRunning(id)) {
                    LocalTimer.stop(id);
                }

                // Set to default limit
                EasySearch.changeProperty(index, 'limit', EasySearch.getIndex(index).defaultLimit);

                LocalTimer.runAt(id, timeout, esInputSearch, {
                    value : searchValue,
                    easySearchID : id,
                    easySearchIndex : index,
                    easySearchReactive : reactive
                });

                SearchVars.set(id, { 'searchingDone' : false, 'searching' : true });
            });
        }
    });

    /* esEach */
    UI.registerHelper('esEach', function () {
        return Template.esEach;
    });

    Template.esEach.helpers({
        'elasticSearchDoc' : function () {
            var config,
                indexConf,
                isReactive,
                options = this.options || {},
                doc = LocalCache.findOne(this.index);

            if (!_.isObject(doc)) {
                return [];
            }

            if (SearchVars.get(generateId(this.index, this.id), 'searching')) {
                return [];
            }

            isReactive = doc.r;

            // Not reactive
            if (doc && doc.d && !isReactive) {
                return doc.d;
            }

            // Is reactive
            if (doc && doc.d) {
                config = EasySearch.getIndexes();
                indexConf = config[this.index];
                return indexConf.collection.find({ _id : { $in : doc.d } }, options);
            }
        }
    });

    /* ifEsIsSearching */
    Template.ifEsIsSearching.isSearching = function () {
        var id = generateId(this.index, this.id),
            isSearching = SearchVars.get(id, 'searching');

        return isSearching ? isSearching : null;
    };

    /* ifEsHasNoResults */
    Template.ifEsHasNoResults.hasNoResults = function () {
        var id = generateId(this.index, this.id),
            cache = LocalCache.findOne(this.index);

        if (SearchVars.get(id, 'searching')) {
            return false;
        }

        return cache && _.isArray(cache.d) && cache.d.length === 0;
    }

    /* esLoadMoreButton */
    Template.esLoadMoreButton.rendered = function () {
        SearchVars.set(generateId(this.data.index, this.data.id), { 'currentLimit' :  EasySearch.getIndex(this.data.index).limit });
    };

    Template.esLoadMoreButton.helpers({
        'content' : function () {
            return this.content ? this.content : 'Load more';
        },
        'hasMoreResults' : function () {
            var id = generateId(this.index, this.id);

            return !SearchVars.get(id, 'searching')
                    && (SearchVars.get(id, 'total') > SearchVars.get(id, 'currentLimit'));
        }
    });

    Template.esLoadMoreButton.events({
        'click button' : function () {
            var templateScope = this,
                id = generateId(this.index, this.id),
                currentLimit = EasySearch.getIndexes()[this.index].limit,
                howManyMore = this.howMany ? this.howMany : 10;

            templateScope.reactive = this.reactive !== "false";

            EasySearch.changeProperty(this.index, 'limit', currentLimit + howManyMore);
            EasySearch.search(this.index, SearchVars.get(id, 'currentValue'), function (err, data) {
                if (err) {
                    throw new Meteor.Error(500, "Searching failed");
                }

                SearchVars.set(id, { 'total' : data.total });
                SearchVars.set(id, { 'currentLimit' : currentLimit + howManyMore });
                processSearchResults(templateScope.index, data, templateScope.reactive);
            });
        }
    });

    EasySearch.ComponentVariables = SearchVars;
})();
