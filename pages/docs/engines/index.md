---
title: Engines
order: 3
---

Engines contain the core functionality of EasySearch. They can be re-used for multiple indexes, as long as it's not configured specific to an index. The default set of engines all use mongo, either on the client or server side. Engines that search on the server do not conflict with existing publications, as EasySearch uses creates _fake collection_ to synchronize data. Every engine allows you to pass in an optional configuration object to change it's behaviour.

```javascript
// Client and Server
let index = new EasySearch.Index({
  ...
  engine: new EasySearch.MongoDB({
    sort: () => ['score']
  })
});
```

## List of engines

The following engines are available to use with EasySearch. Having a look at the [core code](https://github.com/matteodem/meteor-easy-search/tree/master/packages/easysearch:core/lib/engines) might also give you an idea of how engines work and what configurable values there are.

### MongoDB

The MongoDB engine searches the specified collection directly with MongoDB on the server and uses subscriptions to retrieve reactive data. It uses a simple regex that matches the string that's searched for inside the specified fields.

#### Parameters
* __aggregation__: String that defines what [mongo selector](http://docs.mongodb.org/manual/reference/operator/query/or/) the selector should use for the index fields. By default it uses `$or`
* __selector(searchObject, options)__: Function that returns a mongo selector
* __selectorPerField(field, searchString)__: Function that returns a sub selector for each field
* __sort(searchObject, options)__: Function that returns a sort specifier
* __fields(searchObject, options)__: Function that returns the fields to return when searching
 
You might notice that there is a `searchObject` parameter for `selector` and a `searchString` for `selectorPerField`. That's because MongoDB allows you to search only in a specified field, as long as it's allowed.

### Minimongo

This engine inherits the exact same configuration as MongoDB but does the search only on the client and thus is only useable on the client. You can still create the index on both environments though. It makes sense to use it when you're transitioning your app or you want to manage the searchable documents through your own publications.

### MongoTextIndex

The MongoTextIndex engine inherits the same configuration as MongoDB but uses a more modern feature of MongoDB which are [text indexes](http://docs.mongodb.org/manual/core/index-text/) that offer a more mature approach to searching.

### ElasticSearch

ElasticSearch is a mature search engine that's capable of advanced searching techniques. It is not part of the core anymore but you can add `easysearch:elasticsearch` to your app and [read the documentation](https://github.com/matteodem/meteor-easy-search/tree/master/packages/easysearch:elasticsearch) to get started.

