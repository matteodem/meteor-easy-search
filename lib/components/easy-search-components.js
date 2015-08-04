EasySearch.getComponentInstance = (function () {
  'use strict';

  var m = {},
    defaults,
    LocalTimer,
    inputCache,
    SearchVars,
    autosuggestCache = {},
    initializedComponents = [];

  // Default values
  defaults = {
    'inputTimeout' : 200,
    'event' : 'keyup',
    'allDocsOnEmpty' : false
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

  // Helper to check for initialized components
  function componentIsInitialized(id) {
    return initializedComponents.indexOf(id) > -1;
  }

  // Perform a search with esInput
  function easySearch(opts) {
    var id = opts.id,
      searchValue = opts.value;

    if (opts.input) {
      searchValue = opts.input.val();
    }

    if (searchValue.length < 1 && !opts.allDocsOnEmpty) {
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
    var conf,
      id = generateId(index, componentId);

    SearchVars.set(id, {
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
    var conf = EasySearch.getIndex(index),
      id = generateId(index, componentId),
      searchValue = SearchVars.get(id, 'currentValue'),
      allDocsOnEmpty = SearchVars.get(id, 'allDocsOnEmpty');

    if ((!searchValue || !searchValue.length) && !allDocsOnEmpty) {
      return;
    }

    if (EasySearch._usesSubscriptions(index)) {
      SearchVars.set(id, { searching: true });

      if (conf.subscriptionHandle) {
        conf.subscriptionHandle.stop();
      }

      conf.subscriptionHandle = Meteor.subscribe(conf.name + '/easySearch', {
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
    } else {
      EasySearch.search(index, searchValue, function (err, data) {
        if (err) {
          throw new Meteor.Error(500, m.searchingFailed + ': ' + err.message);
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
      // count of documents
      conf.countSubscriptionHandle = Meteor.subscribe(index + '/easySearchCount');

      Deps.autorun(function () {
        var searchValue = SearchVars.get(id, 'currentValue'),
          allDocsOnEmpty = SearchVars.get(id, 'allDocsOnEmpty'),
          res = conf.find({}, { sort: conf.reactiveSort(searchValue) });

        if ((!searchValue || !searchValue.length) && !allDocsOnEmpty) {
          return;
        }

        SearchVars.set(id, {
          searchResults : res.fetch(),
          currentLimit : conf.limit,
          total: conf.count()
        });
      });
    }

    initializedComponents.push(id);
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

  function paginate(index, componentId, step) {
    var conf = EasySearch.getIndex(index),
      id = generateId(index, componentId),
      data = EasySearch.pagination(index, step);

    SearchVars.set(id, {
      paginationSkip: data.skip,
      currentControl: data.step
    });
  }

  /*
   * esInput
   */

  Template.esInput.rendered = function () {
    this.autorun(function () {
      var data = Template.currentData();

      EasySearch.eachIndex(data.index, function (index, opts) {
        var id = generateId(index, data.id);

        // set up default limit
        SearchVars.set(id, { 'defaultLimit' : opts.limit });
        if (!componentIsInitialized(index)) {
          createSearchDependency(index, data.id);
        }

        // paginate to first result set if allDocsOnEmpty is true
        if (data.allDocsOnEmpty) {
          // TODO: is this the right way? let it be like this for now
          SearchVars.set(id, { allDocsOnEmpty: data.allDocsOnEmpty });
          paginate(index, data.id, 1);
        }
      });
    });

    // In case we have something in the field, search - That is also the case if we have a code refresh!
    if (Template.currentData().value) {
      this.$('input').keyup();
    }
  };

  Template.esInput.destroyed = function () {
    var data = Template.currentData();

    EasySearch.eachIndex(data.index, function (index, opts) {
      opts.countSubscriptionHandle && opts.countSubscriptionHandle.stop();
      opts.subscriptionHandle && opts.subscriptionHandle.stop();
      clear(index, data.id);
      initializedComponents.splice(initializedComponents.indexOf(index), 1);
    });
  };

  Template.esInput.helpers({
    type: function () {
      var self = this;
      return self.type || 'text';
    }
  });

  Template.esInput.events({
    'keyup input' : function (e) {
      var id,
        eventScope = this,
        input = $(e.target),
        timeout = this.timeout || defaults.inputTimeout,
        event = this.event || defaults.event,
        allDocsOnEmpty = this.allDocsOnEmpty,
        searchValue = input.val().trim(),
        keyCode = e.keyCode || e.which;

      // Reset values if search value is empty
      if (searchValue.length === 0 && !allDocsOnEmpty) {
        EasySearch.eachIndex(this.index, function (index) {
          clear(index, eventScope.id);
        });

        return;
      }

      // Do not search when the value hasn't changed or pressed other key than enter with enter configuration
      if ((inputCache === searchValue) || ("enter" === event && 13 !== keyCode)) {
        EasySearch.eachIndex(this.index, function (index) {
          SearchVars.set(generateId(index, eventScope.id), { 'searching' : false });
        });

        return;
      }

      inputCache = searchValue;

      EasySearch.eachIndex(this.index, function (index) {
        id = generateId(index, eventScope.id);

        // If already running, stop the timer
        if (LocalTimer.isRunning(id)) {
          LocalTimer.stop(id);
        }

        // Set to default limit and reset pagination
        EasySearch.changeLimit(index, SearchVars.get(id, 'defaultLimit'));
        paginate(index, eventScope.id, 1);

        // Run the search at the specified timeout
        LocalTimer.runAt(id, timeout, easySearch, {
          id : id,
          input : input,
          allDocsOnEmpty: allDocsOnEmpty
        });

        SearchVars.set(id, { 'searchingDone' : false, 'searching' : true });
      });
    },
    'keydown input' : function (e) {
      var eventScope = this;

      if ($(e.target).val().trim().length === 0 && !this.allDocsOnEmpty) {
        EasySearch.eachIndex(this.index, function (index) {
          clear(index, eventScope.id);
        });
      }
    }
  });

  /*
   * esEach
   */
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
        return conf.find({}, { sort: conf.reactiveSort() });
      }

      // Enhance documents
      return _.map(docs, function (doc) {
        return conf && conf.collection && _.isFunction(conf.collection._transform) ? conf.collection._transform(doc) : doc;
      });
    }
  });

  /*
   * ifEsIsSearching
   */
  Template.ifEsIsSearching.helpers({
    'isSearching' : function () {
      return mapIndexesWithLogic(this, function (index, tplScope) {
        var isSearching = SearchVars.get(generateId(index, tplScope.id), 'searching');

        return isSearching ? isSearching : null;
      });
    }
  });

  /*
   * ifEsHasNoResults
   */
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

  /*
   * esLoadMoreButton
   */
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

  /*
   * esPagination
   */
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

      if (skip > 0) {
        controls[0].state = 'active';
      }

      for (i = 1; i <= sites; i += 1) {
        control = { text: i.toString(), state: 'active', action: i };

        if (i === currentControl) {
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
      var parentScope = Template.currentData();

      paginate(parentScope.index, parentScope.id, this.action);
      triggerSearch(parentScope.index, parentScope.id);
    }
  });

  /*
   * esAutosuggest
   */
  Template.esAutosuggest.created = function () {
    var tplScope = this,
      id = generateId(tplScope.data.index, tplScope.data.id);

    SearchVars.set(id, { 'autosuggestSelected' : [] });

    Deps.autorun(function () {
      autosuggestCache.value = SearchVars.get(id, 'currentValue');
    });
  };

  Template.esAutosuggest.helpers({
    'isString' : function (val) {
      return _.isString(val);
    },
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
      var parts, fieldValue, firstField,
        index = EasySearch.getIndex(options.index),
        self = this,
        searchValue = autosuggestCache.value,
        regex = new RegExp(searchValue + '(.+)?', 'i'),
        results = {},
        fieldResult = {};

      if (!_.isArray(index.field)) {
        index.field = [index.field];
      }
      firstField = index.field[0];

      _.each(index.field, function (field) {

        fieldValue = self[field];

        if (!_.isString(fieldValue)) {
          fieldValue = '';
        }

        parts = fieldValue.split(regex);

        if (parts.length > 1) {
          fieldResult = {
            'pre': parts[0],
            'post' : parts[1],
            'value': fieldValue,
            'found': (new RegExp(searchValue, 'i')).exec(fieldValue).shift()
          };
        } else {
          fieldResult = {
            'pre': '',
            'post' : fieldValue,
            'value': fieldValue,
            'found': ''
          };
        }

        results[field] = fieldResult;
      });

      return {
        'pre' : results[firstField].pre,
        'found' : results[firstField].found,
        'post' : results[firstField].post,
        'value' : results[firstField].value,
        'id' : this._id,
        'esResults': results,
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
      paginate : function (step) {
        return paginate(conf.index, conf.id, step);
      },
      search : function (value) {
        var id = this.generateId();

        if (!componentIsInitialized(id)) {
          createSearchDependency(conf.index, conf.id);
        }

        easySearch({ id : id, value : value });
      },
      get : function (key) {
        return SearchVars.get(this.generateId(), key);
      },
      on : function (key, eventFunction) {
        var autorun, componentScope = this;

        autorun = _.isFunction(conf.autorun) ? conf.autorun : Deps.autorun;

        return autorun(function () {
          eventFunction(SearchVars.get(componentScope.generateId(), key));
        });
      },
      resetAutosuggest : function (esInput) {
        // Clear the esInput field if one was supplied
        if (esInput && _.isFunction(esInput.val)) {
          esInput.val('');
        }

        // Clear the search results
        this.clear();

        // Clear the selected items
        SearchVars.set(this.generateId(), { 'autosuggestSelected' : [] });
      },
      manageAutosuggestValues : function(callback) {
        // Make sure callback is a function
        if (!_.isFunction(callback)) {
          throw new Meteor.Error('invalid-callback', 'Callback must be a function');
        }

        var current = this.get('autosuggestSelected');

        var newValues = callback(current);

        if (newValues) current = newValues;

        // Make sure callback didn't malform current before we overwrite the stored values
        check(current, [{ id: String, value: String, pos: Match.Optional(Number) }]);

        SearchVars.set(this.generateId(), {'autosuggestSelected' : current});
      }
    };
  };
})();
