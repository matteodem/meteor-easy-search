class InputComponent extends BaseComponent {

  onCreated() {
    super.onCreated(...arguments);

    this.options = Object.assign({}, this.defaultOptions, this.getData().options);
    this.search('');
  }

  events() {
    let debouncedSearch = _.debounce((searchString) => {
      this.search(searchString);
    }, this.options.timeout);

    return [{
      'keyup input' : function (e) {
        let currentSearchString = $(e.target).val().trim();

        if (this.searchString !== currentSearchString) {
          this.searchString = currentSearchString;
          debouncedSearch(currentSearchString);
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
