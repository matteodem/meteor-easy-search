/**
 * The FieldInputComponent lets you search through configured indexes for a specified fild.
 *
 * @type {FilterComponent}
 */
EasySearch.FilterComponent = class FilterComponent extends BaseComponent {
  onCreated() {
    if (!_.isString(this.getData().property)) {
      throw new Meteor.Error('no-property', 'Please provide the property for your filter component');
    }
    const optionsIsValid = _.all(this.getData().options, option => _.has(option, 'label', 'value'));
    if (!_.isArray(this.getData().options) || !optionsIsValid) {
      throw new Meteor.Error('no-options', 'Options missing or not valid. Please provide valid options');
    }

    this.setProperty = _.debounce((value) => {
      this.eachIndex((index, name) => {
        index.getComponentMethods().addProps(this.getData().property, value);
      });
    }, this.options.timeout);

    super.onCreated();
  }

  /**
   * Event map.
   * @returns {Object}
   */
  events() {
    return [{
      'change select': function (e) {
        this.setProperty($(e.target).val());
      }
    }]
  }

  /**
   * returns the options
   *
   * @returns {Object}
   */
  get options() {
    return {
      options: this.getData().options
    }
  }

  /**
   * Anything passed to the html that is not used by this class
   * will just be passed plainly to the select field.
   *
   * @returns {Object}
   */
  get attrs() {
    return _.omit(this.getData(), 'options', 'index', 'property');
  }

  get defaultOptions() {
    return {
      timeout: 50
    }
  }
}

EasySearch.FilterComponent.register('EasySearch.Filter');
