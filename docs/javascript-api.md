---
layout: doc
title: Javascript API
---


All the Components are implemented on top of the Javascript API. You don't have to decide for 
one or the other, you can for example define a custom selector and sort object for a search index and still use
the Blaze Components with it.

All the following methods are called on the global ``EasySearch`` Object.

### createSearchIndex(name, options)

``name`` is the index name as a string and ``options`` are details to how the search should behave:

* **field** (required): String or an array of strings with all the fields used for searching
* **collection** (required): Meteor.Collection to sync the data from (uses observeChanges)
* **limit** (default: 10): Return an array with a maxium length of this defined number
* **query**: Define a custom query function which returns a [selector object](http://docs.meteor.com/#selectors)
* **sort**: Defined a custom sort function which returns a [sort specifier](http://docs.meteor.com/#sortspecifiers)
* **use** (default: 'minimongo'): Which engine to use for searching ('elastic-search' or use createSearcher for custom enginges)
* **convertNumbers** (default: false) Strings only containing digits will be converted to a Javascript number
* **permission** Optional function(searchString) which can be used to check for permission
* **returnFields** Define an array of document fields to return
* **changeResults** Return an array of results enhanced with custom changes
* **props** Object that holds custom configuration, for sorting, filtering on the client (use changeProperty)

```javascript
// On Client and Server
EasySearch.createSearchIndex('cars', {
  'field' : ['name', 'price'],
  'collection' : Cars,
  'limit' : 20,
  'props' : {
    'onlyShowDiscounts' : true // demo purpose configuration, can be used in query  
  },
  'query' : function (searchString, opts) {
    // Default query that is used for searching
    var query = EasySearch.getSearcher(this.use).defaultQuery(this, searchString);

    // this contains all the configuration specified above
    if (this.props.onlyShowDiscounts) {
      query.discount = true;
    }

    return query;
  }
});
```

You can also call it with ``(new Meteor.Collection(...)).initEasySearch(field, options)`` Is the same as ``createSearchIndex`` but it is more convenient,
since it already provides you with the ``name`` and the ``collection`` property through the Collection. The options stay the same as written above.

```javascript
// On Client and Server
TestCollection.initEasySearch(['name', 'price'], {
  'limit' : 30,
  ...
});
```

If you have a reactive search index (by default it is), then you have access to the publication scope inside the query method, under ```this.publicationScope```,
if you want to access user information for example.

```javascript
EasySearch.createSearchIndex('players', {
 ...
  'query': function(searchString, opts) {
    // Default query that will be used for the mongo-db selector
    var query = EasySearch.getSearcher(this.use).defaultQuery(this, searchString);
    query.userId = this.publicationScope.Id;
    return query;
  }
  ...
});
```

### (Server) search(name, searchString, options[, callback])

Search over the defined index, where the name is the same string as defined when creating the Search Index. The
search String is the part that is being searched for, for example "Toyo" would be the searchString, 
when "Toyota" wants to be found. ``options`` can override ``limit`` or custom fields which can be used in the ``query`` or
``sort``.

```javascript
// On Server
EasySearch.search('cars',  "Toyo", {
  'limit' : 50 // override the 20, defined in createSearchIndex
  'field' : 'name' // also only search for names
}[, callback]);
```

### (Client) search(name, searchString, callback)

Acts the same as on the server, but the callback is required. The options defined on the client are sent to the server call,
so using ``changeProperty`` on the Client makes extended / faceted search possible.

```javascript
// On Server
EasySearch.search('cars',  "Toyo", function (err, data) {
  // use data.results and data.total
});
```

### (Client) searchMultiple(indexes, searchString, callback)

Exact same behaviour than search but it expects an array of names for ``indexes``. The callback
gets called for every result returned for each index (if the array has 3 indexes, callback gets called 3 times).

```javascript
EasySearch.searchMultiple(['cars', 'people'], 'Volvo', function (error, data) {
  // use data
});
```

### (Client) changeProperty(name, key, value)

``name`` and ``key`` are both strings, the first is the index name and the second the key (for example limit or field).
``value`` can be any type of value as long as it's used right when searching.

```javascript
// On Client, for example when implementing a custom filter
EasySearch.changeProperty('cars',  'filterTimeRange', '2012-10-10 2014-10-01');
```

### (Server) createSearcher(key, methods)

EasySearch internally uses a private ``Searchers`` object, which holds all the engines. As of now there's support for elastic-search, mongo-db,
minimongo (default). If you want to add a custom engine do this with this method. ``key`` is the name for the engine, for example:
``lucene``. ``methods`` is an object which expects following two methods to be defined:

* createSearchIndex (name, options) 
* search (name, searchString, [options, callback])

```javascript
// Server
EasySearch.createSearcher('lucene', {
  'createSearchIndex' : function (name, options) {
    // Setup lucene index, care about the options defined
  },
  'search' : function (name, searchString, options, callback) {
    /* 
     Perform a search and return, call the callback
     The return object has to look like this:

     {
     'total' : 310,
     'results' : [Document, Document ...]
     }
     */
  }
});
```

Use this search engine on the indexes like this.

```javascript
// Client and Server
EasySearch.createSearchIndex('cars', {
    ...
    'use' : 'lucene'
    ...
});
```

This enables you to add custom implementations easily for different search engines, while still using the provided Blaze Components
and EasySearch API.
