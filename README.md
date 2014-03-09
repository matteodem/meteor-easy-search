Meteor Easy Search
=====================

Searching made simple, featuring Elastic Search!

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
* Fast(er) Search with Elastic Search
* Automatic syncing beetween Mongo Collection and Search Indexes (with [observeChanges](http://docs.meteor.com/#observe_changes))

## How to install

```sh
cd /path/to/elastic-search && bin/elasticsearch # running at http://localhost:9200/
cd /path/to/project && mrt add easy-search
meteor
```

## Examples

Here's the [leaderboard example](https://github.com/matteodem/easy-search-leaderboard), made searchable.

## Advanced Usage

### On Server

```javascript
// Advanced configuration
EasySearch.config({
	'host'  : '192.100.10.10', 	// default: "localhost"
	'port'  : '9100', 			// default: 9200
	'safe'  : true,				// default: false
	'debug' : true 				// no default, See when documents are added or removed
});

EasySearch.conditions({
	'onChangeProperty' : function () {} // when trying to changeProperty() on the client
});

EasySearch.search(id, searchString[, fields], callback); // fields are mapped over each document

EasySearch.getElasticSearchClient(); // returns an ElasticSearchClient
// see [here](https://github.com/phillro/node-elasticsearch-client)
```

See [here](https://github.com/phillro/node-elasticsearch-client#executing-commands-on-elasticsearch), for more config() possibilities.

### On Client and Server

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    'format' : 'raw',		                    // format of returned data, default: mongo
    'query'  : function (fields, searchString), // return a query object on the server
    // http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl.html
});

EasySearch.changeProperty(name, key, value); // change a property set with createSearchIndex()
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

## Early Stage

This package is in an early development stage, features to come:

* Search Components with the new templating engine
