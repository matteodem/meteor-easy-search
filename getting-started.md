---
layout: page
title: Getting started
---

### Basic Searching

With Easy Search, you create "Search Indexes" to search your MongoDB documents. You can use the Blaze Components or
Javascript API to implement the frontend. There are 2 ways to create a "search index".

```javascript
Cars = new Meteor.Collection('cars');

EasySearch.createSearchIndex('cars', {
    'field' : ['name', 'price'],  // required, searchable field(s)
    'collection' : Cars,          // required, Mongo Collection
    'limit' : 20                  // not required, default is 10
});

// OR (Both do the exact same thing)

Cars.initEasySearch(['name', 'price'], {
    'limit' : 20
});
```

The default [search engine](https://github.com/matteodem/meteor-easy-search/wiki/Search-Engines) is "minimongo", which let's you filter through your existing subscription of documents. If you want to search all the documents in the collection, use __mongo-db__ as your [engine](https://github.com/matteodem/meteor-easy-search/wiki/Search-Engines). The Blaze Components should be sufficient for almost all cases.


```html
{% raw %}
<template name="search">
    {{> esInput index="players" placeholder="Search..." }}

    {{#esEach index="players"}}
        {{> player}}
    {{/esEach}}

    {{#ifEsHasNoResults index="players"}}
        <div class="no-results">No results found!</div>
    {{/ifEsHasNoResults}}
</template>
{% endraw %}
```

Have a look at the different [components](https://github.com/matteodem/meteor-easy-search/wiki/Blaze-Components). There are a variety of parameters that can be changed when using the Components, when creating the search index
or / and when performing the search with the Javascript API.

### Simple Autosuggest Input

Use following code to add a autosuggest input field, which uses a Meteor.Collection as a data provider.

```javascript
// On Client and Server
Tags = new Meteor.Collection('tags');

// name is the field to search over
Tags.initEasySearch('name');
```

```html
{% raw %}
{{> esAutosuggest index="tags" placeholder="Add tags"}}
{% endraw %}
```

This is all that it takes to add a "select2" like input field to your app. Get the data with the jQuery method ``esAutosuggestData()``. Have a look [here](https://github.com/matteodem/meteor-easy-search/wiki/Autosuggest-Field) for an advanced example.


### Using Javascript

```javascript
EasySearch.search('cars', 'Toyota', function (err, data) {
    // data.total contains a number of all found results
    // data.results contains all the limited results
});

EasySearch.searchMultiple(['cars', 'companies', ...], 'Toyota', function (err, data) {
    // Callback is called for each index 
});
```

It is recommended to have a look at the detailed API parameters for createSearchIndex (initEasySearch) and the Blaze Components, before implementing custom solutions!
