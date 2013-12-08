Meteor Easy Search
=====================

Searching made simple, featuring Elastic Search!

## Dependencies

This package uses Elastic Search as the Search Engine, get Elastic Search [here](http://www.elasticsearch.org/download/). Install it by running bin/elasticsearch, and you got your search server running at http://localhost:9200/.

## Quick Intro

Create a search index like that:

```
// on Client and Server
EasySearch.createSearchIndex('cars', {
    'collection'    : Cars,        // instanceof Meteor.Collection
    'field'         : 'company',   // can also be an array of fields
    'limit'         : 20,          // default: 10
});

EasySearch.search('cars', 'Volvo'); // Returns all cars with a company which fuzzy equal Volvo

// Change properties, useful for enhancing your search
EasySearch.changeProperty('cars', 'limit', 50);
```

## Early Stage

This package is in an early development stage, features to come:

* Expose existing Elastic Search Features
* Search Components with the new templating engine
