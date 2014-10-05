EasySearch.getComponentInstance = (function () {
  'use strict';

  var m = {},
    defaults,
    LocalTimer,
    inputCache,
    SearchVars,
    autosuggestCache = {};

  // Default values
  defaults = {
    'inputTimeout' : 200,
    'event' : 'keyup'
  };

  // Session Abstraction
  Session.setDefault('esVariables', {});

  /**
   * Following Variables are available:
   * - searching
   * - searchingDone
   * - currentValue
   * - searchResults
   * - total
   * - currentLimit
   */
  SearchVars = {
    'set' : function (id, obj) {
      _.each(obj, function (val, key) {
        Session.set('esVariables_' + id + '_' + key, val);
      });
    },
    'get' : function (id, key) {
      return Session.get('esVariables_' + id + '_' + key);
    }
  };

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

  // Perform a search with esInput
  function esInputSearch (conf) {
    var id = conf.easySearchID,
      searchValue = conf.input.val();

    if (searchValue.length < 1) {
      SearchVars.set(id, { 'searching' : false, 'searchingDone' : false });
    } else {
      SearchVars.set(id, { 'currentValue' : searchValue });
    }
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

  // Clear the current search results + variables
  function clear(index, componentId) {
    SearchVars.set(generateId(index, componentId), {
      'searching' : false,
      'searchingDone' : false,
      'total' : 0,
      'currentValue' : '',
      'searchResults' : []
    });

    inputCache = '';
  }

  // Trigger the search, for example when adding filters
  function triggerSearch(index, componentId) {
    var conf = EasySearch.getIndex(index),
      id = generateId(index, componentId),
      searchValue = SearchVars.get(id, 'currentValue');

    EasySearch.search(index, searchValue, function (err, data) {
      if (err) {
        throw new Meteor.Error(500, m.searchingFailed);
      }

      if (searchValue) {
        SearchVars.set(id, {
          'searching' : false,
          'total' : data.total,
          'searchingDone' : true,
          'searchResults' : data.results,
          'currentLimit' : conf.limit
        });
      }
    });
  }

  // Create a search dependency for reactive search
  function createSearchDependency(index, componentId) {
    Deps.autorun(function () {
      triggerSearch(index, componentId);
    });
  }

  /* esInput */
  Template.esInput.created = function () {
    var inputScope = this;

    inputScope.data.index = !_.isArray(inputScope.data.index) ? [inputScope.data.index] : inputScope.data.index;

    _.each(inputScope.data.index, function (index) {
      // set up default limit
      SearchVars.set(generateId(index, inputScope.data.id), { 'defaultLimit' : EasySearch.getIndex(index).limit });
      createSearchDependency(index, inputScope.data.id);
    });
  };

  Template.esInput.events({
    'keyup input' : function (e) {
      var id,
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
          clear(index, eventScope.id);
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

        // If already running, stop the timer
        if (LocalTimer.isRunning(id)) {
          LocalTimer.stop(id);
        }

        // Set to default limit
        EasySearch.changeProperty(index, 'limit', SearchVars.get(id, 'defaultLimit'));

        LocalTimer.runAt(id, timeout, esInputSearch, {
          input : input,
          easySearchID : id,
          easySearchIndex : index,
          easySearchReactive : reactive
        });

        SearchVars.set(id, { 'searchingDone' : false, 'searching' : true });
      });
    },
    'keydown input' : function (e) {
      var eventScope = this;

      if ($(e.target).val().length === 0) {
        this.index = _.isArray(this.index) ? this.index : [this.index];

        _.each(this.index, function (index) {
          clear(index, eventScope.id);
        });
      }
    }
  });

  /* esEach */
  UI.registerHelper('esEach', function () {
    return Template.esEach;
  });

  Template.esEach.helpers({
    'elasticSearchDoc' : function () {
      var id = generateId(this.index, this.id),
        docs = SearchVars.get(id, 'searchResults');

      if (!_.isObject(docs)) {
        return [];
      }

      if (SearchVars.get(id, 'searching')) {
        return [];
      }

      return docs;
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
        docs = SearchVars.get(id, 'searchResults'),
        searchValue = SearchVars.get(id, 'currentValue');

      if (SearchVars.get(id, 'searching') || (_.isString(searchValue) && searchValue.length === 0)) {
        return false;
      }

      return _.isArray(docs) && docs.length === 0;
    }));
  };

  /* ifEsInputIsEmpty */
  Template.ifEsInputIsEmpty.inputIsEmpty = function () {
    var searchValue = SearchVars.get(generateId(this.index, this.id), 'currentValue');

    return (!searchValue || searchValue.length === 0) || "undefined" === typeof searchValue;
  };

  /* esLoadMoreButton */
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
        currentLimit = EasySearch.getIndex(this.index).limit,
        howManyMore = this.howMany ? this.howMany : 10;

      templateScope.reactive = this.reactive !== "false";

      EasySearch.changeProperty(this.index, 'limit', currentLimit + howManyMore);
      triggerSearch(this.index, this.id);
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

      searchValue = autosuggestCache.value;
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
      var currentValues,
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
          'autosuggestSelected' : currentValues
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

        firstField  = _.isArray(index.field) ? index.field[0] : index.field;

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

  return function (conf) {
    return {
      clear : _.bind(clear, {}, conf.index, conf.id),
      generateId : _.bind(generateId, {}, conf.index, conf.id),
      triggerSearch : _.bind(triggerSearch, {}, conf.index, conf.id),
      get : function (key) {
        return SearchVars.get(this.generateId(), key);
      },
      on : function (key, eventFunction) {
        var autorun, componentScope = this;

        autorun = _.isFunction(conf.autorun) ? conf.autorun : Deps.autorun;

        return autorun(function () {
          eventFunction(SearchVars.get(componentScope.generateId(), key));
        });
      }
    };
  };
})();
