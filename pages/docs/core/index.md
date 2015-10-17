---
title: Core
order: 1
---

The core provides you with a basic set of Javascript classes and methods to implement search. `easy:search` wraps the core and components package, but if
you only want to use the Javascript part of Easy Search you can add `easysearch:core` to your app. It provides you with reactive search and a set of
[engines](/docs/engines/) to choose from.

## Customization

Easy Search provides a lot of possible configuration out of the box, with a minimum of required configuration.
There are three levels on which you can customize your search.

### Index

The index is the only part that requires you to add configuration for it to work. You need to specify an __engine__ for the search logic,
the __collection__ that contains the data that you want to search and the __fields__ to search over. You can optionally specify permission
to restrict general access to your index.

```javascript
let index = new EasySearch.Index({
  collection: someCollection,
  fields: ['name'],
  engine: new EasySearch.MongoTextIndex(),
  permission: (userId) => {
    return userHasAccess(userId); // always return true or false here
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
    sort: () => ['score'], // sort by score
    selector: function (searchObject, options) {
      // selector contains the default mongo selector that Easy Search would use
      let selector = this.defaultConfiguration().selector(searchObject, options);

      // modify the selector to only match documents where region equals "New York"
      selector.region = 'New York';

      return selector;
    }
  })
});
```

### search

It is possible to pass in an object as the second argument when using `search` in your application. This enables you to use custom props
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
    selector: function (searchObject, options) {
      let selector = this.defaultConfiguration().selector(searchObject, options),
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

Have a look at the [API Reference](/docs/api-reference/) or [Engines section](/docs/engines/) to see all possible configuration values.

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
