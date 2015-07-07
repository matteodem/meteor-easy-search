var methods = {
  /**
   * Set up a search index.
   *
   * @param name
   * @param options
   * @returns {void}
   */
  'createSearchIndex' : function (name, options) {
    if (Meteor.isServer && options.useTextIndexes) {
      var indexDoc = EasySearch._transformFieldsToIndexDocument(options.field),
        rawCollection = EasySearch.getIndex(name).collection.rawCollection(),
        indexOptions = { name: name };

      if (options.weights) {
        indexOptions.weights = options.weights();
      }

      rawCollection.createIndex(
        indexDoc, indexOptions, function (err, res) {
          options.onCreatedIndex && options.onCreatedIndex(res);
        }
      );
    }
  },
  /**
   *
   * Perform a really simple search with mongo db.
   *
   * @param {String} name
   * @param {String} searchString
   * @param {Object} options
   * @param {Function} callback
   * @returns {Object}
   */
  'search' : function (name, searchString, options, callback) {
    var cursor,
      results,
      selector,
      pipeline,
      aggregates,
      cursorOptions,
      index = EasySearch.getIndex(name);

    if (!_.isObject(index)) {
      return;
    }

    options.limit = options.limit || 10;

    // if several, fields do an $or search, otherwise only over the field
    selector = index.query(searchString, options);

    if (!selector) {
      return { total: 0, results: [] };
    }

    cursorOptions = {
      sort : index.sort(searchString, options)
    };

    if (options.returnFields) {
      cursorOptions.fields = EasySearch._transformToFieldSpecifiers(options.returnFields);
    }

    if (options.skip) {
      cursorOptions.skip = options.skip;
    }

    if (Meteor.isServer) {
      cursorOptions.limit = options.limit;
    }

    if (options.useTextIndexes) {
      if (!cursorOptions.fields) {
        cursorOptions.fields = {};
      }

      cursorOptions.fields.score = { $meta: 'textScore'  };
    }

    cursor = index.collection.find(selector, cursorOptions);

    if (Meteor.isServer) {
      // Get the total count by aggregating
      pipeline = [
        { $match: selector },
        {
          $group: { _id: "id", total: { $sum: 1 } }
        }
      ];

      aggregates = index.collection.aggregate(pipeline);

      results = {
        'results': cursor.fetch(),
        'total': aggregates.length >= 1 ? aggregates[0].total : 0
      };
    } else {
      // The aggregate operations are not supported on client,
      // so we have to explicitly count all records in the search result


      results = {
        'results' : _.first(cursor.fetch(), options.limit),
        'total' : cursor.count()
      };
    }

    if (_.isFunction(callback)) {
      callback(results);
    }

    return results;
  },
  /**
   * The default mongo-db query - selector used for searching.
   *
   * @param {Object} conf
   * @param {String} searchString
   * @param {Function} regexCallback
   *
   * @returns {Object}
   */
  'defaultQuery' : function (conf, searchString, regexCallback) {
    if (Meteor.isServer && conf.useTextIndexes) {
      return { $text: { $search: searchString } };
    } else if (Meteor.isClient || !conf.useTextIndexes) {
      // Convert numbers if configured
      if (conf.convertNumbers && parseInt(searchString, 10) == searchString) {
        searchString = parseInt(searchString, 10);
      }

      var stringSelector = { '$regex' : '.*' + searchString + '.*', '$options' : 'i'},
        selector = {
          $or: []
        };

      if (regexCallback) {
        stringSelector['$regex'] = regexCallback(searchString);
      }

      _.each(conf.field, function (fieldString) {
        var orSelector = {};

        if (_.isString(searchString)) {
          orSelector[fieldString] = stringSelector;
        } else if (_.isNumber(searchString)) {
          orSelector[fieldString] = searchString;
        }

        selector['$or'].push(orSelector);
      });

      return selector;
    }
  },
  /**
   * The default mongo-db sorting method used for sorting the results.
   *
   * @param {Object} conf
   * @return array
   */
  'defaultSort' : function (conf) {
    return conf.field;
  }
};

if (Meteor.isClient) {
  EasySearch.createSearcher('minimongo', methods);
} else if (Meteor.isServer) {
  EasySearch.createSearcher('mongo-db', methods);
}

