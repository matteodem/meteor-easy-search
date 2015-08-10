class InputComponent extends BaseComponent {

  onCreated() {
    super.onCreated(...arguments);

    this.search('');
  }

  events() {
    // TODO: put this somewhere else
    this.debouncedSearch = _.debounce((searchString) => {
      this.search(searchString);
    }, this.options.timeout);

    return [{
      'keyup input' : function (e) {
        let currentSearchString = $(e.target).val().trim();

        if (this.searchString !== currentSearchString) {
          this.dict.set('searching', true);
          this.searchString = currentSearchString;
          this.debouncedSearch(currentSearchString);
        }
      },
      'keydown input' : function (e) {
        if ($(e.target).val().trim().length === 0) {
          // TODO: call stop() on cursor
        }
      }
    }]
  }

  inputAttributes() {
    return Object.assign({}, InputComponent.defaultAttributes, this.getData().attributes);
  }

  static get defaultAttributes() {
    return {
      type: 'text'
    };
  }

  get defaultOptions() {
    return {
      timeout: (this.index.config.engine instanceof EasySearch.Minimongo) ? 20 : 200
    };
  }
}

InputComponent.register('EasySearch.Input');
