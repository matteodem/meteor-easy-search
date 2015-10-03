/**
 * A search collection represents a reactive collection on the client,
 * which is used by the ReactiveEngine for searching.
 *
 * @type {SearchCollection}
 */
SearchCollection = class SearchCollection {
  /**
   * Constructor
   *
   * @param {Object}         indexConfiguration Index configuration
   * @param {ReactiveEngine} engine             Reactive Engine
   *
   * @constructor
   */
  constructor(indexConfiguration, engine) {
    check(indexConfiguration, Object);
    check(indexConfiguration.name, Match.OneOf(String, null));

    if (!(engine instanceof ReactiveEngine)) {
      throw new Meteor.Error('invalid-engine', 'engine needs to be instanceof ReactiveEngine');
    }

    this._indexConfiguration = indexConfiguration;
    this._name = `${indexConfiguration.name}/easySearch`;
    this._engine = engine;

    if (Meteor.isClient) {
      this._collection = new Meteor.Collection(this._name);
    } else if (Meteor.isServer) {
      this._setUpPublication();
    }
  }

  /**
   * Get name
   *
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * Get engine
   *
   * @returns {ReactiveEngine}
   */
  get engine() {
    return this._engine;
  }

  /**
   * Find documents on the client.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Options
   *
   * @returns {Cursor}
   */
  find(searchDefinition, options) {
    if (!Meteor.isClient) {
      throw new Error('find can only be used on client');
    }

    this._publishHandle = Meteor.subscribe(this.name, searchDefinition, options);

    let count = this._getCount();
    let mongoCursor = this._getMongoCursor(searchDefinition, options);

    if (!_.isNumber(count)) {
      return new Cursor(mongoCursor, 0, false);
    }

    return new Cursor(mongoCursor, count);
  }

  /**
   * Get the count of the cursor.
   *
   *
   * @returns {Cursor.count}
   * @private
   */
  _getCount() {
    let countDoc = this._collection.findOne('searchCount');

    if (countDoc) {
      return countDoc.count;
    }
  }

  /**
   * Get the mongo cursor.
   *
   * @param {Object} searchDefinition Search definition
   *
   * @returns {Cursor}
   * @private
   */
  _getMongoCursor(searchDefinition) {
    return this._collection.find({ _id: { $not: 'searchCount' }, __searchDefinition: JSON.stringify(searchDefinition) }, {
      transform: (doc) => {
        delete doc.__searchDefinition;
        delete doc.__sortPosition;
        this.engine.config.transform(doc);
        return doc;
      },
      sort: ['__sortPosition']
    });
  }

  /**
   * Set up publication.
   *
   * @private
   */
  _setUpPublication() {
    var collectionScope = this,
      collectionName = this.name;

    Meteor.publish(collectionName, function (searchDefinition, options) {
      if (!collectionScope._indexConfiguration.permission()) {
        throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
      }

      collectionScope.engine.checkSearchParam(searchDefinition, collectionScope._indexConfiguration);

      let cursor = collectionScope.engine.search(searchDefinition, {
        search: options,
        index: collectionScope._indexConfiguration
      });

      this.added(collectionName, 'searchCount', { count: cursor.count() });

      let resultsHandle = cursor.mongoCursor.observe({
        addedAt: (doc, atIndex, before) => {
          doc = collectionScope.engine.config.beforePublish('addedAt', doc, atIndex, before);
          doc.__searchDefinition = JSON.stringify(searchDefinition);
          doc.__sortPosition = atIndex;
          this.added(collectionName, doc._id, doc);
        },
        changedAt: (doc, oldDoc, atIndex) => {
          doc = collectionScope.engine.config.beforePublish('changedAt', doc, oldDoc, atIndex);
          doc.__searchDefinition = JSON.stringify(searchDefinition);
          doc.__sortPosition = atIndex;
          this.changed(collectionName, doc._id, doc)
        },
        movedTo: (doc, fromIndex, toIndex, before) => {
          doc = collectionScope.engine.config.beforePublish('movedTo', doc, fromIndex, toIndex, before);
          doc.__sortPosition = toIndex;

          let beforeDoc = collectionScope._indexConfiguration.collection.findOne(before);

          if (beforeDoc) {
            beforeDoc.__sortPosition = fromIndex;
            this.changed(collectionName, beforeDoc._id, beforeDoc);
          }

          this.changed(collectionName, doc._id, doc);
        },
        removedAt: (doc, atIndex) => {
          doc = collectionScope.engine.config.beforePublish('removedAt', doc, atIndex);
          this.removed(collectionName, doc._id)
        }
      });

      this.onStop(function () {
        resultsHandle.stop();
      });

      this.ready();
    });
  }
};