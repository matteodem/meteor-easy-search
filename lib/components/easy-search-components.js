(function () {
    'use strict';

    var m = {},
        defaults,
        LocalTimer,
        inputCache = {},
        LocalCache = new Meteor.Collection(null);

    // Default values
    defaults = {
        'inputTimeout' : 200,
        'reactive' : true,
        'event' : 'keyup'
    };

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
                { _id : index, r : isReactive, d : data }
            );

            return;
        }

        // If it has to be reactive
        LocalCache.upsert(
            { _id : index },
            {
                _id : index,
                r : isReactive,
                d : _.map(data, function(doc) { return doc._id; })
            }
        );
    }

    // Perform a search with esInput
    function esInputSearch (conf) {
        var id = conf.easySearchID,
            searchValue = conf.value,
            index = conf.easySearchIndex;

        if (searchValue.length < 1) {
            Session.set('esSearching_' + id, false);
            LocalCache.upsert({ _id : index }, { _id : index, d : null });
            return;
        }

        EasySearch.search(index, searchValue, function (err, data) {
            if (err) {
                throw new Meteor.Error(500, "Searching failed");
            }

            inputCache[id] = searchValue;
            Session.set('esSearching_' + id, false);
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
                searchCache = inputCache[id],
                reactive = this.reactive !== "false",
                timeout = this.timeout || defaults.inputTimeout,
                event = this.event || defaults.event,
                searchValue = $(e.target).val(),
                keyCode = e.keyCode || e.which;

            // Pressed not enter with enter configuration
            if ("enter" === event && 13 !== keyCode) {
                Session.set('notSearching', true);
                return;
            }

            // Only search when the value hasn't changed
            if (searchCache === searchValue) {
                return;
            }

            // If already running, stop the timer
            if (LocalTimer.isRunning(id)) {
                LocalTimer.stop(id);
            }

            // Run the search at the specified timeout
            Session.set('notSearching', false);
            searchValue = $(e.target).val();

            if (!_.isArray(this.index)) {
                this.index = [this.index];
            }

            _.each(this.index, function (index) {
                id = generateId(index, eventScope.id);

                LocalTimer.runAt(id, timeout, esInputSearch, {
                    value : searchValue,
                    easySearchID : id,
                    easySearchIndex : index,
                    easySearchReactive : reactive
                });
                Session.set('esSearching_' + id, true);
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
            isSearching = Session.get('esSearching_' + id);

        return isSearching ? isSearching : null;
    };

    /* ifEsHasNoResults */
    Template.ifEsHasNoResults.hasNoResults = function () {
        var cache = LocalCache.findOne(this.index);

        if ((Session.get('esSearching_' + generateId(this.index, this.id)))
                || Session.get('notSearching')) {
            return false;
        }

        return !(cache && _.isArray(cache.d) && cache.d.length > 0);
    }
})();
