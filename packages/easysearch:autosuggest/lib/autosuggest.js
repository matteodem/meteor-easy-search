Template['EasySearch.Autosuggest'].onRendered(function () {
  /**
   * Helper function to return data for the autosuggest component.
   *
   * @param {String} val        Value to return
   * @param {*}      defaultVal Optional default value to provide
   *
   * @return {*}
   */
  const getDataValue = (val, defaultVal) => this.data[val] || defaultVal;

  if (!this.data.index) {
    throw new Meteor.Error('no-index', 'Please provide an index for your component');
  }

  if (this.data.indexes) {
    throw new Meteor.Error('only-single-index', 'Can only specify one index');
  }

  let handle, computation,
    index = this.data.index,
    valueField = getDataValue('valueField', '_id'),
    labelField = getDataValue('labelField', index.config.fields[0]),
    searchField = getDataValue('searchField', labelField),
    changeConfiguration = getDataValue('changeConfiguration', (c) => c),
    suggestionTemplate = Template[
      getDataValue('renderSuggestion', 'EasySarch.Autogguest.DefaultRenderSuggestion')
    ];

  const select = this.$('select').selectize(changeConfiguration({
    valueField,
    labelField,
    searchField,
    create: false,
    preload: true,
    render: {
      option: (item, escape) => Blaze.toHTMLWithData(suggestionTemplate, {
        doc: item,
        _id: item._id,
        label: _.get(item, labelField)
      })
    },
    load: (query, callback) => {
      if (computation) {
        computation.stop();
      }

      computation = Tracker.autorun(() => {
        let cursor = index.search(query),
          docs = cursor.fetch();

        if (handle) {
          clearTimeout(handle);
        }

        handle = setTimeout(() => {
          select[0].selectize.clearOptions();
          callback(docs);
        }, 100);
      });
    }
  }));
});
