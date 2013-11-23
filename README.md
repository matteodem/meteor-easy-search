Meteor Easy Search
=====================

Searching made simple

## Quick Intro

Create a search index like that:

```
EasySearch.createSearchIndex('cars', {
    'collection' : Cars,        // instanceof Meteor.Collection
    'field'      : 'company',   // can also be an array of fields
    'limit'      : 20,          // default: 10
    'exact'      : true         // default: false
});

EasySearch.search('cars', 'Volvo'); // Returns all cars with a company which equal Volvo

// Change properties, useful for enhancing your search
EasySearch.changeProperty('cars', 'limit', 50);
```

## Early Stage

This package is in an early development stage, features to come:

* Search Components with the new templating engine
* Search Filters, maybe also analyzers
