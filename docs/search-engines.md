---
layout: doc
title: Search Engines
---

### Available Search Engines by Default 

You can set a ```use``` parameter when creating a Search Index. This paramater specifies the Search Engine you want to use. Per default it is "minimongo", which searches through your existing subscriptions of data on the collection:

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    "use" : "elastic-search",
    ...
});
```

You can choose beetween following search engines:

__minimongo (default)__
* Good for filtering over existing subscriptions
* better for small amount of documents

__mongo-db (default)__
* lets you search all the docs in your collection
* no publications / subscriptions needed

__elastic-search__
* Mature approach for bigger searches
* Also all documents are searchable

The search is always reactive, as long as you don't set ```reactive``` to be false (createSearchIndex).

### Adding your own search engine

It is possible to add your own integration for search engine, without losing any functionality of the Blaze Components and Javascript API.

```javascript
EasySearch.createSearcher(engineName, {
  'createSearchIndex' : function (name, options) {  },
  'search' : function (name, searchString, options[, callback]) { return Array; }
});
```

```createSearchIndex``` handles the synchronization of the collection, in the case of the "elastic-search" engine. Having a look at the [source code](https://github.com/matteodem/meteor-easy-search/blob/master/lib/searchers/elastic-search.js#L57) shows that observeChanges takes over a lot of troubling work when taking care of that problem.

```search``` is the main search method which is used every time a user searches with a Blaze Component or through the Javascript API.

It's **recommended** to have a look at the [already available search engines](https://github.com/matteodem/meteor-easy-search/tree/master/lib/searchers) before implementing your own. **Pull Requests** for additional search engines are welcome!
