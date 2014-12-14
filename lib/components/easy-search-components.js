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
      SearchVars.set(id, { 'currentValue' : searchValue, 'skip' : 0 });
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
    var conf;

    SearchVars.set(generateId(index, componentId), {
      'searching' : false,
      'searchingDone' : false,
      'total' : 0,
      'currentValue' : '',
      'searchResults' : [],
      'skip' : 0
    });

    if (EasySearch._usesSubscriptions(index)) {
      conf = EasySearch.getIndex(index);
      conf.subscriptionHandle && conf.subscriptionHandle.stop();
    }

    inputCache = '';
  }

  // Trigger the search, for example when adding filters
  function triggerSearch(index, componentId) {
    var newSubscription,
      conf = EasySearch.getIndex(index),
      id = generateId(index, componentId),
      searchValue = SearchVars.get(id, 'currentValue');

    if (!searchValue || !searchValue.length) {
      return;
    }

    if (EasySearch._usesSubscriptions(index)) {
      newSubscription = Meteor.subscribe(conf.name + '/easySearch', {
        value: searchValue,
        limit: conf.limit,
        props: conf.props,
        skip: conf.skip
      }, function () {
        // when subscription is ready then it's finished searching
        SearchVars.set(id, {
          searching : false,
          searchingDone : true
        });
      });

      if (conf.subscriptionHandle) {
        conf.subscriptionHandle.stop();
      }

      conf.subscriptionHandle = newSubscription;
    } else {
      EasySearch.search(index, searchValue, function (err, data) {
        if (err) {
          throw new Meteor.Error(500, m.searchingFailed);
        }

        SearchVars.set(id, {
          'searching' : false,
          'total' : data.total,
          'searchingDone' : true,
          'searchResults' : data.results,
          'currentLimit' : conf.limit
        });
      });
    }
  }

  // Create a search dependency for reactive search
  function createSearchDependency(index, componentId) {
    var conf = EasySearch.getIndex(index),
      id = generateId(index, componentId);

    Deps.autorun(function () {
      triggerSearch(index, componentId);
    });

    if (EasySearch._usesSubscriptions(index)) {
      Deps.autorun(function () {
        var searchValue = SearchVars.get(id, 'currentValue'),
          res = conf.find({}, { sort: conf.sort(searchValue) });

        if (!searchValue || !searchValue.length) {
          return;
        }

        SearchVars.set(id, {
          searchResults : res.fetch(),
          currentLimit : conf.limit,
          total: conf.count()
        });
      });
    }
  }

  // Map over indexes provided + combine them by OR / AND
  function mapIndexesWithLogic(tplScope, callback) {
    var logic = tplScope.logic,
      indexes = tplScope.index,
      combineMethod = logic && logic.toUpperCase() === 'OR' ? 'some' : 'every';

    if (!_.isArray(indexes)) {
      indexes = [indexes];
    }

    return _[combineMethod](_.map(indexes, function (index) {
      return callback(index, tplScope);
    }));
  }

  /* esInput */
  Template.esInput.created = function () {
    this.autorun(function () {
      var data = Template.currentData();

      EasySearch.eachIndex(data.index, function (index, opts) {
        var id = generateId(index, data.id);

        // set up default limit
        SearchVars.set(id, { 'defaultLimit' : opts.limit });
        createSearchDependency(index, data.id);
        opts.countSubscriptionHandle = Meteor.subscribe(index + '/easySearchCount');
      });
    });
  };

  Template.esInput.destroyed = function () {
    var data = Template.currentData();

    EasySearch.eachIndex(data.index, function (index, opts) {
      opts.countSubscriptionHandle && opts.countSubscriptionHandle.stop();
      opts.subscriptionHandle && opts.subscriptionHandle.stop();
      clear(index, data.id);
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

      // Reset values if search value is empty
      if (searchValue.length === 0) {
        EasySearch.eachIndex(this.index, function (index) {
          clear(index, eventScope.id);
        });

        return;
      }

      // Do not search when the value hasn't changed or pressed other key than enter with enter configuration
      if ((inputCache === searchValue) || ("enter" === event && 13 !== keyCode)) {
        return;
      }

      inputCache = searchValue;

      EasySearch.eachIndex(this.index, function (index) {
        id = generateId(index, eventScope.id);

        // If already running, stop the timer
        if (LocalTimer.isRunning(id)) {
          LocalTimer.stop(id);
        }

        // Set to default limit
        EasySearch.changeLimit(index, SearchVars.get(id, 'defaultLimit'));

        // Run the search at the specified timeout
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
        EasySearch.eachIndex(this.index, function (index) {
          clear(index, eventScope.id);
        });
      }
    }
  });

  /* esEach */
  Template.registerHelper('esEach', function () {
    return Template.esEach;
  });

  Template.esEach.helpers({
    'elasticSearchDoc' : function () {
      var id = generateId(this.index, this.id),
        conf = EasySearch.getIndex(this.index),
        docs = SearchVars.get(id, 'searchResults');

      if (!_.isObject(docs) || SearchVars.get(id, 'searching')) {
        return [];
      }

      if (EasySearch._usesSubscriptions(this.index)) {
        return conf.find({}, { sort: conf.sort() });
      }

      return docs;
    }
  });

  /* ifEsIsSearching */
  Template.ifEsIsSearching.helpers({
    'isSearching' : function () {
      return mapIndexesWithLogic(this, function (index, tplScope) {
        var id = generateId(index, tplScope.id),
          isSearching = SearchVars.get(id, 'searching');

        return isSearching ? isSearching : null;
      });
    }
  });

  /* ifEsHasNoResults */
  Template.ifEsHasNoResults.helpers({
    'hasNoResults' : function () {
      return mapIndexesWithLogic(this, function (index, tplScope) {
        var id = generateId(index, tplScope.id),
          docs = SearchVars.get(id, 'searchResults'),
          searchValue = SearchVars.get(id, 'currentValue');

        if (SearchVars.get(id, 'searching') || (_.isString(searchValue) && searchValue.length === 0)) {
          return false;
        }

        return _.isArray(docs) && docs.length === 0;
      });
    }
  });

  /* ifEsInputIsEmpty */
  Template.ifEsInputIsEmpty.helpers({
    'inputIsEmpty' : function () {
      return mapIndexesWithLogic(this, function (index, tplScope) {
        var id = generateId(index, tplScope.id),
          searchValue = SearchVars.get(id, 'currentValue');

        return (!searchValue || searchValue.length === 0) || "undefined" === typeof searchValue;
      });
    }
  });

  /* esLoadMoreButton */
  Template.esLoadMoreButton.helpers({
    'hasMoreResults' : function hasMoreResults() {
      var id = generateId(this.index, this.id);

      return !SearchVars.get(id, 'searching')
      && (SearchVars.get(id, 'total') > SearchVars.get(id, 'currentLimit'));
    },
    'content' : function () {
      return this.content ? this.content : 'Load more';
    }
  });

  Template.esLoadMoreButton.events({
    'click button' : function () {
      var templateScope = this,
        currentLimit = EasySearch.getIndex(this.index).limit,
        howManyMore = this.howMany ? this.howMany : 10;

      templateScope.reactive = this.reactive !== "false";
      EasySearch.changeLimit(this.index, currentLimit + howManyMore);
      triggerSearch(this.index, this.id);
    }
  });

  /* esPagination */
  Template.esPagination.helpers({
    'hasResults' : function () {
      var id = generateId(this.index, this.id);
      return !SearchVars.get(id, 'searching') && SearchVars.get(id, 'total');
    },
    'control' : function () {
      var i, control, controls,
        id = generateId(this.index, this.id),
        totalResults = SearchVars.get(id, 'total'),
        skip = SearchVars.get(id, 'paginationSkip'),
        currentLimit = SearchVars.get(id, 'currentLimit'),
        currentControl = SearchVars.get(id, 'currentControl'),
        sites = Math.ceil(totalResults / currentLimit);

      controls = [{ text: 'Previous', state: 'disabled', action: EasySearch.PAGINATION_PREV }];

      if (skip > 1) {
        controls[0].state = 'active';
      }

      for (i = 1; i <= sites; i += 1) {
        control = { text: i.toString(), state: 'active', action: i };

        if (sites === 1) {
          control.state = 'disabed';
        } else if (i === currentControl) {
          control.state = 'selected';
        }

        controls.push(control);
      }

      control = { text: 'Next', state: 'active', action: EasySearch.PAGINATION_NEXT };

      if (sites === 1 || (totalResults - skip <= currentLimit)) {
        control.state = 'disabled';
      }

      controls.push(control);

      return controls;
    }
  });

  Template.esPagination.events({
    'click .control:not(.disabled)' : function () {
      var parentScope = Template.parentData(),
        data = EasySearch.pagination(parentScope.index, this.action);

      SearchVars.set(generateId(parentScope.index, parentScope.id), {
        paginationSkip: data.skip,
        currentControl: (data.skip / data.limit) + 1
      });

      console.log(data.skip / data.limit);
      triggerSearch(parentScope.index, parentScope.id);
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
        'doc' : this,
        'options' : options
      };
    }
  });

  Template.esAutosuggest.events({
    'click .suggestions li:not(.remove)' : function (e) {
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

      e.preventDefault();
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
          index = EasySearch.getIndex(this.index),
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

  // For testing
  EasySearch._mapIndexesWithLogic = mapIndexesWithLogic;

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
