# Upgrading from 1.* to 2.0

## General

* Instead of `createSearchIndex(name, options)` you now use the class `EasySearch.Index(configuration)`
* Instead of `EasySearch.search(name, searchString, options[, callback])` you now use the instance method `index.search(searchDefinition, configuration)`
* Instead of `EasySearch.createSearcher(name, options)` you create inherited classes, e.g. from `EasySearch.Engine(configuration)`
* `collection.initEasySearch` has been removed in favor of instantiating an `EasySearch.Index`
* All options that were previously passed to `EasySearch.createSearchIndex` are now split up into three levels of configuration:
 * Engine level configuration, how does the search behave (e.g. sort)
 * Index level configuration, which data is searchable and general configuration (e.g. permission)
 * Search level configuration, configuration specific to a search (e.g. limit)

```javascript

let index = new EasySearch.Index({
  // index level configuration
  collection: myCollection,
  engine: new EasySearch.Minimongo({
    // engine level configuration
    sort : () => ['score']
  })
});

index.search('Marie', {
  // search level configuration / options
  limit: 20,
  props: {
    'maxScore': 200
  }
});
```

* ES6 / ES2015 is now used in the package code
* Packages have been split up into several packages
 * `easysearch:core`: contains the Javascript API
 * `easysearch:components`: contains the Blaze Components
 * `easy:search`: Wrapper package for components and core
 * `easysearch:elasticsearch`: ElasticSearch engine
 * `easysearch:autosuggest`: Autosuggest component
* `matteodem:easy-search` is now deprecated, switch to `easy:search` or one of the sub packages

## Index

* Since there are multiple layers of configuration options most of it has changed places or renamed / removed where it made sense
 * `field` => `fields`: index configuratiion, always an array now
 * `collection` => `collection`: index configuration
 * `limit` => `limit`: search configuration
 * `query` => `selector` and `query`: engine configuration (mongo based engines use `selector` now)
 * `sort` => `sort`: engine configuration
 * `use` => `engine`: index configuration, is now an instanceof Engine
 * `convertNumbers` => _removed_: logic should be configured itself
 * `useTextIndex` => _removed_: It's own engine now (`EasySearch.MongoTextIndex`)
 * `transform` => `transform`: engine configuration, Now always return a document
 * `returnFields` => `beforePublish`: engine configuration, A function to return fields that are published
 * `changeResults` => _removed_: In favor of `beforePublish` or `transform`
 * `props` => `props`: search configuration
 * `weights` => `weights`: engine configuration, only for `EasySearch.MongoTextIndex`
 * `permission` => `permission`: index configuration
* No `EasySearch.searchMultiple` anymore, use the index instances themselves to search on multiple indexes
* No `changeProperty`, `changeLimit` anymore, use the `props` option while using the `search` method
* No `pagination` anymore, use either the components package or implement the pagination logic by using `skip` and `limit` search configuration
* `search` always returns a `EasySearch.Cursor` that can be used in a reactive context

## Components

* Components are now prefixed with `EasySearch` (e.g. `EasySearch.Input`)
* `EasySearch.getComponentInstance` is now split up into two index methods
 * `index.getComponentDict`: Retrieve search values, (e.g. search string, limit)
 * `index.getComponentMethods`: Use search component functionaly (e.g. searching, adding / removing props)


## ElasticSearch

* Not part of core anymore, add `easysearch:elasticsearch` to use
* `body` configuration to change ES body
* ElasticSearch client reachable through `index.config.elasticSearchClient`

## Autosuggest

* Not part of core anymore, add `easysearch:autossugest` to use
* Uses now `jeremy:selectize` for display logic

There are a lot of new features too, feel free to [check them out](http://matteodem.github.io/meteor-easy-search/).
