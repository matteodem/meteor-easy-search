---
layout: doc
title: Core
order: 1
---

The core provides you with a basic set of Javascript classes and methods to implement search. `easy:search` wraps the core and components package, but if
you only want to use the Javascript part of Easy Search you can add `easysearch:core` to your app. It provides you with reactive search and a set of
[engines](../engines/) to choose from. This article assumes you have read the [Getting started](../../getting-started/) page beforehand.

## Customization

Easy Search provides a lot of possible configuration out of the box, with a minimum of required configuration.
There are three levels on which you can customize your search.

### Index

The index is the only part that requires you to add configuration for it to work. You need to specify an __engine__ for the search logic,
the __collection__ that contains the documents that you want to search and the __fields__ to search over. You can optionally specify permission
to restrict general access to your index. You can also specify a __name__ if you want to create several indexes for the same collection.

```javascript
let index = new EasySearch.Index({
  collection: someCollection,
  fields: ['name'],
  engine: new EasySearch.MongoTextIndex(),
  name: 'myAwesomeIndex',
  permission: (options) => {
    return userHasAccess(options.userId); // always return true or false here
  }
});
```

### Engine

If you want to customize or extend the way your Engine searches, then you can add an engine configuration in form of an object.
The `EasySearch.Minimongo` engine for example allows you to rewrite or extend the selector and add sorting.

```javascript
let index = new EasySearch.Index({
  collection: someCollection,
  fields: ['name'],
  engine: new EasySearch.Minimongo({
    sort: () => { score: 1 }, // sort by score
    selector: function (searchObject, options, aggregation) {
      // selector contains the default mongo selector that Easy Search would use
      let selector = this.defaultConfiguration().selector(searchObject, options, aggregation);

      // modify the selector to only match documents where region equals "New York"
      selector.region = 'New York';

      return selector;
    }
  })
});
```

### search

It is possible to pass in an options object as the second argument when using `search` in your application. This enables you to use custom props
to change behavior for app specific data. One example would be to have facet values in there so you can filter
result sets.

```javascript
// index instanceof EasySearch.Index
index.search('Peter', {
  limit: 20
  props: {
    // custom data that can contains EJSON parseable data
    minScore: 50,
    maxScore: 100
  }
});
```

The functionality of filtering for `minScore` and `maxScore` also needs to be implemented for the props to work.

```javascript
let index = new EasySearch.Index({
  ...
  engine: new EasySearch.Minimongo({
    selector: function (searchObject, options, aggregation) {
      let selector = this.defaultConfiguration().selector(searchObject, options, aggregation),
        scoreFilter = {};

      if (options.search.props.maxScore) {
        scoreFilter.$lt = options.search.props.maxScore;
      }

      if (options.search.props.minScore) {
        selector.scoreFilter.$gt =  options.search.props.minScore;
      }

      if (scoreFilter.$gt || scoreFilter.$lt) {
        selector.score = scoreFilter;
      }

      return selector;
    }
  })
});
```

Have a look at the [API Reference](../api-reference/) or [Engines section](../engines/) to see all possible configuration values.

## Searching

Searching is easy. Simply call the index `search` method with an appropriate search definition (mostly strings) and options if needed.

```javascript
// index instanceof EasySearch.Index
let cursor = index.search('Marie'),
  docs = cursor.fetch();

// do stuff
```

The `search` method always returns an EasySearch.Cursor, no matter if on the server or client. It basically wraps a mongo cursor and provides
you with methods such as `fetch` and `count` and let's you access the underlying cursor with a property called `mongoCursor`. This makes it
possible to write custom publications.

```javascript
Meteor.publish('carSearch', (searchString) {
  check(searchString, String);

  // index instanceof EasySearch.Index
  return index.search(searchString).mongoCursor;
})
```

Certain engines also allow to search by objects as your searchDefinition, specifying the fields that are searched.

```javascript
let index = new EasySearch.Index({
  ...
  fields: ['name'],
  allowedFields: ['name', 'score'],
  engine: new EasySearch.MongoDB()
});

// only search for the name
let docs = index.search({ name: 'Marie' }).fetch();

// will fail, since allowedFields does not contain that field
let fail = index.search({ password: '1234' }).fetch();
```

By default the specified index `fields` are searchable but you can specify your own `allowedFields` that are checked inside the engines
when searched with objects

## Extensibility

If the configuration possibilities that EasySearch provide aren't sufficient then you can extend the core classes. One example would
be when creating your own engine. The following code extends the `EasySearch.MongoDB` to call a method `doSomeStuff` when an index is being created.

```javascript
class MyCustomEngine extends EasySearch.MongoDB {
  onIndexCreate(indexConfig) {
    super.onIndexCreate(indexConfig);
    // indexConfig is the configuration object passed when creating a new index
    doSomeStuff(indexConfig.fields);
  }
}
```

You could now use that engine when creating an index. Don't forget that the code is isomorphic, which means that it's executed
on both the server and client.

```javascript
let index = new EasySearch.Index({
  ...
  engine: new MyCustomEngine()
});
```
