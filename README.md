Meteor Easy Search
=====================

Searching made simple, featuring Elastic Search!
Here's the [leaderboard example](https://github.com/matteodem/easy-search-leaderboard), made searchable.

## Quick Intro

Create a search index like that:

```javascript
// on Client and Server
EasySearch.createSearchIndex('cars', {
    'collection'    : Cars,			// instanceof Meteor.Collection
    'field'         : 'company',	// can also be an array of fields
    'limit'         : 20,           // default: 10
});

EasySearch.search('cars', 'Volvo', function (error, data) {
	console.log(data); // data has all cars with a company which fuzzy equal Volvo
});

// Change properties, useful for enhancing your search
EasySearch.changeProperty('cars', 'limit', 50);
```

As of now, a [fuzzy like this query](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-flt-query.html) is used. If you have any recommendations, reasons why we shouldn't use this kind of query, open a ticket.

## Features
* Simple search API
* Blaze Components
* Support for Elastic Search
* Automatic syncing beetween Collection and ES (with [observeChanges](http://docs.meteor.com/#observe_changes))

## Blaze Components

A basic example of all the components in a template

```html
<template name="searchTpl">
    <div class="search-input">
        {{> esInput index="players" placeholder="Search..." }}
    </div>

    {{#ifEsIsSearching index="players"}}
        <div>Loading...</div>
    {{/ifEsIsSearching}}

    <div class="results-wrapper">
        {{#esEach index="players"}}
            {{> player}}
        {{/esEach}}

        {{#ifEsHasNoResults index="players"}}
            <div class="no-results">No results found!</div>
        {{/ifEsHasNoResults}}
    </div>
</template>
```

You can implement a text input, the search results view, the loading bar and
more with the provided Components.

### esInput and esEach

esInput provides you with a text field and esEach lets you iterate
over the found search results for that text input field.

``esInput`` field has following parameters:
* index (required, the index name)
* classes (not required, additional classes)
* id (not required, id of the input)
* placeholder (not required, placeholder)
* event (not required, the event to listen on (only "enter" or "keyup" for now))
* reactive (default true, make the search not reactive if wished)
* timeout (not required, when to start the search after keyup)

``esEach`` has following parameters:
* index (required, the index name)
* options (not required, the options for the find cursor, [see here](http://docs.meteor.com/#find))

### ifEsIsSearching

Show certain content when a search is performed. For example when you got an
input for a specified ```index``` you would have to specify the same ```index```
parameter.

``ifEsSearching`` field has following parameters
* index (required, the index name)
* id (not requid, if specified on ```esInput``` add the id)

### ifEsHasNoResults

Show "no results found" content after the search has been performed.

``ifEsHasNoResults`` field has following parameters
* index (required, the index name)
* id (not requid, if specified on ```esInput``` add the id)

### Additional info

* When you specify an id on the search input (esInput), you have to add the id
parameter also in the ```ifEsHasNoResults``` and ```ifEsSearching```

## How to install

```sh

# Install Elastic Search through brew.
brew install elasticsearch
# Start the service, runs on http://localhost:9200.
elasticsearch -f -D es.config=/usr/local/opt/elasticsearch/config/elasticsearch.yml
# Add the package to your project.
mrt add easy-search
```

If you're getting following error, that means that your elastic search instance isn't running at the specified location (default: localhost:9200):

```sh
Error: connect ECONNREFUSED
```

## Advanced Usage

### On Server

```javascript
// Advanced configuration
EasySearch.config({
	'host'  : '192.100.10.10', // default: "localhost"
	'port'  : '9100', 		 // default: 9200
	'safe'  : true,			// default: false
	'debug' : true 			// no default
});

EasySearch.conditions({
    // when trying to changeProperty() on the client
	'onChangeProperty' : function () {}
});

// fields are mapped over each document
EasySearch.search(id, searchString[, fields], callback);

// returns an ElasticSearchClient
// see [here](https://github.com/phillro/node-elasticsearch-client)
EasySearch.getElasticSearchClient();
```

See [here](https://github.com/phillro/node-elasticsearch-client#executing-commands-on-elasticsearch), for more config() possibilities.

### On Client and Server

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    // format of returned data, default: mongo
    'format' : 'raw',
    // return a query object on the server
    'query'  : function (fields, searchString),
    // http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl.html
});

// change a property set with createSearchIndex()
EasySearch.changeProperty(name, key, value);
/*
	will not validate on the server, but on the client with conditions
	for example do something like this:
*/
EasySearch.changeProperty('cars', 'limit', 100);
```

### Without using Elastic Search

If you don't want to use Elastic Search and profit of the performance, you can use mongodb for searching.
Simply add a 'use' property when creating the search index.

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    'use' : 'mongo-db'
});

```

The ```use``` property is elastic-search by default.

### Tips

* Setup conditions which validate the limit to be not bigger than 100, or whatever you think your server can handle
* Use array in the fields property, to get a easily enhanced searched over all your mongodb fields
* config() and conditions() return your configuration / conditions, if you need them
