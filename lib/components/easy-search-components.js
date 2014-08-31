(function () {
  'use strict';

  var m = {},
    defaults,
    LocalTimer,
    inputCache,
    SearchVars,
    autosuggestCache = {},
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

  // Cache Permissions
  LocalCache.allow({
    insert : function () { return true; },
    update : function () { return true; },
    remove : function () { return true; }
  });

  // Error Messages
  m.specifyIndex = 'Specify an index, for example {{> esInput index="name"}}!';
  m.searchingFailed = "Searching failed within the EasySearch API";
  m.firstValueStringAutosuggest = "Use a string value as the first field specified for autosuggest!";

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
        throw new Meteor.Error(500, m.searchingFailed);
      }

      SearchVars.set(id, {
        'searching' : false,
        'total' : data.total,
        'searchingDone' : true,
        'searchResults' : data.results,
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
          inputCache = '';
          LocalCache.remove({ _id : index });
          SearchVars.set(id, { 'searchingDone' : false, 'currentValue' : '', 'searching' : false, 'searchResults' : [] });
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
    },
    'keydown input' : function (e) {
      if ($(e.target).val().length === 0) {
        SearchVars.set(generateId(this.index, this.id), { 'currentValue' : '' });
      }
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
        options = this.options || null,
        doc = LocalCache.findOne({ '_id' : this.index });

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

        if (options) {
          return indexConf.collection.find({ _id : { $in : doc.d } }, options);
        }

        // TODO: Find a more performant way than this for ordering the documents
        // TODO: Handle this in the EasySearch.search (client) method?
        return _.sortBy(indexConf.collection.find({ _id : { $in : doc.d } }).fetch(), function (document) {
          return doc.d.indexOf(document._id);
        });
      }
    }
  });

  /* ifEsIsSearching */
  Template.ifEsIsSearching.isSearching = function () {
    var tplScope = this,
      combineMethod = tplScope.logic && tplScope.logic.toUpperCase() === 'OR' ? 'some' : 'every';

    if (!_.isArray(this.index)) {
      this.index = [this.index];
    }

    return _[combineMethod](_.map(this.index, function (index) {
      var id = generateId(index, tplScope.id),
        isSearching = SearchVars.get(id, 'searching');

      return isSearching ? isSearching : null;
    }));
  };

  /* ifEsHasNoResults */
  Template.ifEsHasNoResults.hasNoResults = function () {
    var tplScope = this,
      combineMethod = tplScope.logic && tplScope.logic.toUpperCase() === 'OR' ? 'some' : 'every';

    if (!_.isArray(this.index)) {
      this.index = [this.index];
    }

    return _[combineMethod](_.map(this.index, function (index) {
      var id = generateId(index, tplScope.id),
        cache = LocalCache.findOne({ '_id' : index }),
        searchValue = SearchVars.get(id, 'currentValue');

      if (SearchVars.get(id, 'searching') || (_.isString(searchValue) && searchValue.length === 0)) {
        return false;
      }

      return cache && _.isArray(cache.d) && cache.d.length === 0;
    }));
  };

  /* ifEsInputIsEmpty */
  Template.ifEsInputIsEmpty.inputIsEmpty = function () {
    var searchValue = SearchVars.get(generateId(this.index, this.id), 'currentValue');

    return !searchValue || searchValue.length === 0;
  };

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
          throw new Meteor.Error(500, m.searchingFailed);
        }

        SearchVars.set(id, { 'total' : data.total });
        SearchVars.set(id, { 'currentLimit' : currentLimit + howManyMore });
        processSearchResults(templateScope.index, data, templateScope.reactive);
      });
    }
  });

  /* esAutosuggest */
  Template.esAutosuggest.created = function () {
    var tplScope = this,
      id = generateId(tplScope.data.index, tplScope.data.id);

    SearchVars.set(id, { 'autosuggestSelected' : [] });

    Deps.autorun(function () {
      autosuggestCache.value = SearchVars.get(id, 'currentValue');
    });
  };

  Template.esAutosuggest.rendered = function () {
    var tplScope = this,
      id = generateId(tplScope.data.index, tplScope.data.id);

    Deps.autorun(function () {
      var input = $(tplScope.find('input')),
        wrapper = $(tplScope.find('div')),
        values = SearchVars.get(id, 'autosuggestSelected');

      // Reposition the input when a value gets added
      input.css('padding-left', wrapper.find('.selected.values').width());
    });
  };

  Template.esAutosuggest.helpers({
    'selectedValue' : function () {
      var id = generateId(this.index, this.id);

      return _.map(SearchVars.get(id, 'autosuggestSelected'), function (val) {
        return {
          'id' : id,
          'docId' : val.id,
          'value' : val.value
        };
      });
    },
    'selected' : function () {
      var suggestionsSelected = SearchVars.get(generateId(this.options.index, this.options.id), 'suggestionsSelected');
      return _.isObject(suggestionsSelected) && suggestionsSelected.id === this.id ? 'selected' : '';
    },
    'isHidden' : function () {
      var id = generateId(this.index, this.id),
        inputValue = SearchVars.get(id, 'currentValue'),
        searchingDone = SearchVars.get(id, 'searchingDone');

      return (inputValue && inputValue.length > 0) && searchingDone  ? 'show' : 'hide';
    },
    'snippets' : function (options) {
      var regex, firstFieldValue, searchValue, parts,
        index = EasySearch.getIndex(options.index),
        firstField  = _.isArray(index.field) ? index.field[0] : index.field;

      firstFieldValue = this[firstField];

      if (!_.isString(firstFieldValue)) {
        throw new Error(m.firstValueStringAutosuggest);
      }

      searchValue = autosuggestCache.value,
        regex = new RegExp(searchValue + '(.+)?', "i");
      parts = firstFieldValue.split(regex);

      // Not found in the first field
      if (parts.length === 1) {
        return {
          'pre' : firstFieldValue,
          'value' : firstFieldValue,
          'id' : this._id,
          'options' : options
        };
      }

      return {
        'pre' : parts[0],
        'found' : (new RegExp(searchValue, 'i')).exec(firstFieldValue).shift(),
        'post' : parts[1],
        'value' : firstFieldValue,
        'id' : this._id,
        'options' : options
      };
    }
  });

  Template.esAutosuggest.events({
    'click .suggestion:not(.remove)' : function (e) {
      var values,
        id = generateId(this.options.index, this.options.id),
        wrapper = $(e.target).closest('.es-autosuggest-wrapper'),
        input = wrapper.find('input');

      // Add a box in front of the input which is the selected "value"
      values = SearchVars.get(id, 'autosuggestSelected');
      values.push({ 'id' : this.id, 'value' : this.value });
      SearchVars.set(id, { 'autosuggestSelected' :  values, 'currentValue' : '' });

      input.val('').keyup().keypress().keydown();

      e.preventDefault();
    },
    'click .remove' : function (e) {
      var tplScope = this;

      // Removes a suggestion
      SearchVars.set(this.id, { 'autosuggestSelected' :  _.reject(
        SearchVars.get(this.id, 'autosuggestSelected'), function (val) {
          return val.id === tplScope.docId;
        })
      });
    },
    'keydown input' : function (e) {
      var selected, currentValues,
        id = generateId(this.index, this.id), input = $(e.target),
        selected = SearchVars.get(id, 'suggestionsSelected');

      if (!$(e.target).val() && !e.which === 8) {
        return;
      }

      if (e.which === 13 && selected && _.isObject(selected)) {
        // Enter
        currentValues = SearchVars.get(id, 'autosuggestSelected');
        currentValues.push(selected);

        SearchVars.set(id, {
          'autosuggestSelected' : currentValues,
        });

        $(e.target).val('');
        SearchVars.set(id, { 'suggestionsSelected' : '' });
      } else if (e.which === 40 || e.which === 38) {
        // Down or Up
        var incrementalValue,
          toBeSelectedDoc, firstField,
          index = EasySearch.getIndex(this.index[0]),
          suggestions = SearchVars.get(id, 'searchResults');

        if (!index || !suggestions) {
          return;
        }

        firstField = firstField  = _.isArray(index.field) ? index.field[0] : index.field;

        // If there's none selected
        if (!selected && e.which === 40) {
          selected = {
            'pos' : -1
          };
        } else if (!selected && e.which === 38) {
          selected = {
            'pos' : suggestions.length
          };
        }

        // Take the one below or up, decide by key
        incrementalValue = e.which === 40 ? 1 :  -1;

        toBeSelectedDoc = suggestions[selected.pos + incrementalValue];

        if (!toBeSelectedDoc) {
          return;
        }

        SearchVars.set(id, { 'suggestionsSelected' : {
          'value' : toBeSelectedDoc[firstField],
          'id' : toBeSelectedDoc._id,
          'pos' : selected.pos + incrementalValue
        }});

        e.preventDefault();
      } else if (e.which === 8 && input.val().length === 0) {
        // Remove
        SearchVars.set(id, {
          'autosuggestSelected' : _.initial(SearchVars.get(id, 'autosuggestSelected'))
        });
      }
    },
    'keyup input' : function () {
      var id = generateId(this.index, this.id);

      if (SearchVars.get(id, 'searching')) {
        SearchVars.set(id, { 'suggestionsSelected' : '' });
      }
    }
  });

  EasySearch.ComponentVariables = SearchVars;
  EasySearch.Components = {
    'generateId' : generateId
  };
})();
