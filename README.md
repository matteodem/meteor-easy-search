Meteor Easy Search
=====================

Searching made simple, featuring Elastic Search!

## Quick Intro

Create a search index like that:

```
// on Client and Server
EasySearch.createSearchIndex('cars', {
    'collection'    : Cars,			// instanceof Meteor.Collection
    'field'         : 'company',	// can also be an array of fields
    'limit'         : 20,          // default: 10
    'format' 		 : 'raw'		// if nothing set, it returns an array of "mongo styled" docs
});

EasySearch.search('cars', 'Volvo', function (data) {
	console.log(data); // data has all cars with a company which fuzzy equal Volvo
});

// Change properties, useful for enhancing your search
EasySearch.changeProperty('cars', 'limit', 50);
```

As of now, a [fuzzy like this query](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-flt-query.html) is used. If you have any recommendations, reasons why we shouldn't use this kind of query, open a ticket.

## How to install

### Dependencies

This package uses Elastic Search as its Search Engine. Get it [here](http://www.elasticsearch.org/download/).

### Bash

```
cd /path/to/elastic-search && bin/elasticsearch # running at http://localhost:9200/
cd /path/to/project && mrt add easy-search
```

## Advanced Usage

### On Server

```
// Advanced configuration
EasySearch.config({
	'host'  : '192.100.10.10', // default: "localhost"
	'port'  : '9100', 			// default: 9200
	'safe   : true 				// default: false
	'debug' : true 				// no default, See when documents are added or removed
});

// see https://github.com/phillro/node-elasticsearch-client#executing-commands-on-elasticsearch

EasySearch.conditions({
	'onChangeProperty' : function () {} // when trying to changeProperty() on the client
});
```

### On Client and Server

```
EasySearch.changeProperty(name, key, value); // change a property set with createSearchIndex()
/* 
	will not validate on the server, but on the client with conditions
	for example do something like this:
*/
EasySearch.changeProperty('cars', 'limit', 100);
```

### Tips

* Setup conditions which validate the limit to be not bigger than 100, or whatever you think your server can handle
* Use array in the fields property, to get a easily enhanced searched over all your mongodb fields
* config() and conditions() return your configuration / conditions, if you need them


## Early Stage

This package is in an early development stage, features to come:

* Expose existing Elastic Search Features
* Search Components with the new templating engine
