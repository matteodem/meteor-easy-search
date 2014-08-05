Easy Search
=====================

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Use the Blaze Components + Javascript API to get started. Since v1.0 it uses MongoDB for searching by default, but if you want to go for a mature search engine you can use [Elastic Search](#using-elastic-search).

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard).

## How to install

```sh
cd /path/to/project
mrt add easy-search
```

## Get started

### Autosuggest Example

Use following code to add a autosuggest input field, which uses a Meteor.Collection as a data provider.

```javascript
// On Client and Server
Tags = new Meteor.Collection('tags');

// name is the field to search over
Tags.initEasySearch('name');
```

```html
{{> esAutosuggest index="tags" placeholder="Add tags"}}
```

This is all that it takes to add a "select2" like input field to your app. Get the data with the jQuery method ``esAutosuggestData()``.

### Creating a search index

Search Indexes are used to initialize Easy Search and use it conjunction with the Blaze Components / Javascript API. There are 2 ways to create a "search index".

```javascript
EasySearch.createSearchIndex('cars', {
    'field' : ['name', 'price'],  // required, searchable field(s)
    'collection' : Cars,          // required, the Collection containing the data
    'limit' : 20                  // not required, default is 10
});

// OR

Cars.initEasySearch(['name', 'price'], {
    'limit' : 20
});

// Both do the exact same thing
```

### Searching

Searching is done with the provided Blaze Components.

```html
<template name="search">
    {{> esInput index="players" placeholder="Search..." }}

    {{#esEach index="players"}}
        {{> player}}
    {{/esEach}}
</template>
```

There are a variety of parameters that can be changed when using the Components, when creating the search index
or / and when performing the search with the Javascript API.

```javascript
EasySearch.search('cars', 'Toyota', function (err, data) {
    // data.total contains a number of all found results
    // data.results contains all the limited results
});

EasySearch.searchMultiple(['cars', 'companies', ...], 'Toyota', function (err, data) {
    // Callback is called for each index 
});
```

I recommend to have a look at the detailed API parameters for createSearchIndex (initEasySearch) and the Blaze Components,
before implementing custom solutions!

## Blaze Components

You can add a text input, the search results view, the loading bar and
more with the provided Components.

```html
<template name="searchTpl">
    <div class="search-input">
        {{> esInput index="players" placeholder="Search..." }}
    </div>

    {{#ifEsIsSearching index="players"}}
        <div>Loading...</div>
    {{else}}
        <div class="results-wrapper">
            {{#esEach index="players"}}
                {{> player}}
            {{/esEach}}
        </div>
    {{/ifEsIsSearching}}

    {{#ifEsHasNoResults index="players"}}
        <div class="no-results">No results found!</div>
    {{/ifEsHasNoResults}}
</template>
```

### esInput

**Parameters**
* index (required, the index name)
* classes (not required, additional classes)
* id (not required, id of the input)
* placeholder (not required, placeholder)
* event (not required, the event to listen on (only "enter" or "keyup" for now))
* reactive (default true, make the search not reactive if wished)
* timeout (not required, when to start the search after keyup)

esInput provides you with a text input field. It doesn't make a lot of sense unless you use it together
with esEach (the #each for search indexes).

**Tips**
* Only add an id parameter when you have 2 or more search components on the same index
* Setting "reactive" to false can make the search faster

### esEach

**Parameters**
* index (required, the index name)
* id (only required when also added to the esInput, will not render an HTML id!)
* options (not required, the options for the find cursor, [see here](http://docs.meteor.com/#find))

A way to render each found search item, having the document with all its data.

### esAutosuggest

**Parameters**
* index (required, the index name)
* classes (not required, additional classes)
* id (not required, id of the input)
* placeholder (not required, placeholder)
* event (not required, the event to listen on (only "enter" or "keyup" for now))
* reactive (default true, make the search not reactive if wished)
* timeout (not required, when to start the search after keyup)
* options (not required, the options for the find cursor, [see here](http://docs.meteor.com/#find))
* renderSuggestion (not required, a string for a ``<template>`` to render each suggestion)

Creates a fully self working autosuggest field, which renders suggestions and lets them add you 
with arrow-down and up, enter and remove them with backspace.

You can get your selected autosuggest values like this.
```javascript
// On Client
var values = $('.myAutosuggestInput').esAutosuggestData();
````

### ifEsIsSearching

**Parameters**
* index (required, the index name(s))
* id (only required when also added to the esInput, will not render an HTML id!)
* logic (not required, combine more than one indexes by "OR" or "AND")

Show certain content when a search is performed. For example when you got an
input for a specified ```index``` you would have to specify the same ```index```
parameter.

### ifEsHasNoResults

**Parameters**
* index (required, the index name(s))
* id (only required when also added to the esInput, will not render an HTML id!)
* logic (not required, combine more than one indexes by "OR" or "AND")

Show "no results found" content after the search has been performed.

### Components with multiple indexes

If you want to search over multiple indexes Blaze Components, you can simply change the index
parameter to an array and define one ``esEach`` loop for each index defined.

```html
<div class="search-input">
     <!-- indexes is a javascript array which holds 'players' and 'cars' -->
     {{> esInput index=indexes placeholder="Search..." }}
</div>
<div class="results-wrapper">
     {{#esEach index="players"}}
         {{> player}}
     {{/esEach}}
	
     {{#esEach index="cars"}}
         {{> car}}
     {{/esEach}}
</div>
```

## API

All the Components are implemented on top of the Javascript API. You don't have to decide for 
one or the other, you can for example define a custom selector and sort object for a search index and still use
the Blaze Components with it.

All the following methods are called of the global ``EasySearch`` Object.

### createSearchIndex(name, options)

``name`` is the index name as a string and ``options`` are details to how the search should behave:

* **field** (required): String or an array of strings with all the fields used for searching
* **collection** (required): Meteor.Collection to sync the data from (uses observeChanges)
* **limit** (default: 10): Return an array with a maxium length of this defined number
* **query**: Define a custom query function which returns a [selector object](http://docs.meteor.com/#selectors)
* **sort**: Defined a custom sort function which returns a [sort specifier](http://docs.meteor.com/#sortspecifiers)
* **use** (default: 'mongo-db'): Which engine to use for searching ('elastic-search' or use extendSearch for custom enginges)
* **convertNumbers** (default: false) Strings only containing digits will be converted to a Javascript number
* **permission** Optional function(searchString) which can be used to check for permission

```javascript
// On Client and Server
EasySearch.createSearchIndex('cars', {
    'field' : ['name', 'price'],
    'collection' : Cars,
    'limit' : 20,
    'customSearchFilter' : true,
    'query' : function (searchString) {
        // this contains all the configuration specified above
        return { 'name' : searchString };
    }
});
```

You can also call it with ``(new Meteor.Collection(...)).initEasySearch(field, options)`` Is the same as ``createSearchIndex`` but it is more convenient, since it already provides you with the ``name`` and the ``collection`` property through the Collection. The options stay the same as written above.

```javascript
// On Client and Server
TestCollection.initEasySearch(['name', 'price'], {
    'limit' : 30,
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

### (Server) extendSearch(key, methods)

EasySearch internally uses a private ``Searchers`` object, which holds all the engines. As of now there's support for elastic-search
and mongo-db (default). If you want to add a custom engine do this with this method. ``key`` is the name for the engine, for example:
``lucene``. ``methods`` is an object which expects following two methods to be defined:

* createSearchIndex (name, options) 
* search (name, searchString, [options, callback])

```javascript
// Server
EasySearch.extendSearch('lucene', {
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

### Generated API Doc

There's also generated API Documentation, if you want to see [all the methods available](https://github.com/matteodem/meteor-easy-search/tree/master/docs).
 
## Using Elastic Search

Before v1.0.0 Elastic-Search was the default. It's still here, but since it takes a bit more to setup than without it, it's not the 
default anymore. It's still possible though by specifying it with following:

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    'use' : 'elastic-search'
    ...
});
```

Using Elastic Search not only gives you the possibility to customize the search a lot more, but it also gives you a lot more speed for more
complicated search queries.

### How to install

```sh

# Install Elastic Search through brew.
brew install elasticsearch
# Start the service, runs on http://localhost:9200 by default.
elasticsearch -f -D es.config=/usr/local/opt/elasticsearch/config/elasticsearch.yml
```

### Configuration

Call ``config`` on the Server to configure the host and more, see [Elastic Search Configuration](http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html)

```javascript
// On Server
EasySearch.config({
    'host' : 'localhost:8800',
    ...
});
```

### Differences to using Mongo DB

There are some little differences to when using the default Mongo DB implementation:

For ``EasySearch.createSearchIndex``:

* the ``query`` parameter returns an [Elastic Search Query Object](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-query.html)
* the ``sort`` parameter returns an [Elastic Search Sort Object](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-body.html)

The default is a [fuzzy like this](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-flt-query.html) query. You can still override it with the ``query`` parameter if you want to.
