---
layout: page
title: Getting started
---

### Basic Searching

With Easy Search, you create "Search Indexes" to search your MongoDB documents. You can use the Blaze Components or
Javascript API to implement the frontend. There are different ways to create a "search index". In our easiest example we use the
convenience method ```initEasySearch``` on the collection to create it. Add following code for a basic example.

```javascript
// On Client and Server
Players = new Meteor.Collection('players');

// Extended configuration
Players.initEasySearch(['name', 'score'], {
    'limit' : 20,
    'use' : 'mongo-db'
});
```

As you see we now have an array of searchable fields: Name and score. We also defined a default limit of 20
documents and we told EasySearch to use [mongo-db]({{ site.baseurl }}/docs/search-engines). The ```initEasySearch``` call sets up the
environment to make searching with the Blaze Components possible. The following html snippet allows you to search through the whole Collection.

```html
{% raw %}
<template name="search">
    {{> esInput index="players" placeholder="Search..." }}

    <ul>
        {{#esEach index="players"}}
            <li>Name of the player: {{name}} ({{score}})</li>
        {{/esEach}}
    </ul>

    {{> esLoadMoreButton index="players"}}

    {{#ifEsHasNoResults index="players"}}
        <div class="no-results">No results found!</div>
    {{/ifEsHasNoResults}}

    {{#ifEsIsSearching index="players"}}
            <div>Loading...</div>
    {{/ifEsIsSearching}}
</template>
{% endraw %}
```

_How does this work without any additional configuration?_ 

EasySearch adds all the logic (e.g. events for the ```esInput```) when you use the Blaze Components.
If you want to customize your search, have a look at the [recipes]({{ site.baseurl }}/docs/recipes) and the available API's.

The only thing you need to do to start searching is add documents to the ```Players``` collection with a name and a score field in them.
The default [search engine]({{ site.baseurl }}/docs/search-engines) is "minimongo", which let's you filter through your existing subscription of documents. 
If you want to search all the documents in the collection, use __mongo-db__ as your engine.
The Blaze Components should be sufficient for almost all cases. Feel free to have a look at the different [components]({{ site.baseurl }}/docs/blaze-components).
There are a variety of parameters that can be changed when using the Components, when creating the search index or / and when performing the 
search with the Javascript API.

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

This is all that it takes to add a "select2" like input field to your app. Get the data with the jQuery method ``esAutosuggestData()``. Have a look [here]({{ site.baseurl }}/docs/autosuggest-field) for an advanced example.


### Only Using Javascript

```javascript
EasySearch.search('cars', 'Toyota', function (err, data) {
    // data.total contains a number of all found results
    // data.results contains all the limited results
});

EasySearch.searchMultiple(['cars', 'companies', ...], 'Toyota', function (err, data) {
    // Callback is called for each index 
});
```

The Blaze Components use the Javascript API and custom publish / subscribe methods to implement the search. It is recommended to have a look at
the detailed API parameters for createSearchIndex (same as initEasySearch) and the Blaze Components, before implementing custom solutions!
