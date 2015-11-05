---
layout: page
title: Getting started
---

In Easy Search you use __indexes__ together with __engines__ to search through a specified Mongo Collection. Let's define those two things
before we continue.

### Engine

The engine is named after the technology that it uses to search. There is an `EasySearch.MongoDB` engine for example, which uses MongoDB on the server and subscriptions on the client to retrieve the data. You can configure the general search behavior for engines, but the actual data source is not defined there.
There are a lot predefined [engines](../docs/engines/) but you can easily create your own or extend existing ones.

### Index

The index is the main building block for creating search functionality in your app. It provides you with the `search` method and defines the
data that should be searchable. One part of the configuration is the engine so the index knows how to actually search through the collection.

## Creating An Index

Let's create an index to see how searching works with Easy Search. First add a file that's reachable both on the __client and server__.

```javascript
// On Client and Server
Players = new Mongo.Collection('players');

PlayersIndex = new EasySearch.Index({
  collection: Players,
  fields: ['name', 'score'],
  engine: new EasySearch.Minimongo()
});
```

This configuration tells EasySearch to search through name and score on the Players collection. We told EasySearch to use
[Minimongo](../docs/engines/) as an engine. The Minimongo engine doesn't create new subscriptions and makes sense when you already have the data
that you need to search accessible on the client. If you want to search all the documents in the collection, use [MongoDB](../docs/engines/) as your engine.

## Searching

Now that we got the index setup you can start searching through it.

```javascript
Tracker.autorun(function () {
  let cursor = PlayersIndex.search('Marie');

  console.log(cursor.fetch()); // log found documents with default search limit
  console.log(cursor.count()); // log count of all found documents
});
```

The return value of the `search` method is always an `EasySearch.Cursor`. When you call `fetch` you retrieve an array of documents from the
specified collection. It is also possible to provide custom options.

```javascript
Tracker.autorun(function () {
  console.log(PlayersIndex.search('Marie', { limit: 5, skip: 10 }).fetch());
});
```

Have a look at the [Core section](../docs/core/) to find out the many customization possibilities around searching.

## Adding Components

Easy Search also provides customizable [Blaze Components](../docs/components/) out of the box.

```html
{% raw %}
<template name="search">
  {{> EasySearch.Input index=playersIndex}}

  <ul>
    {{#EasySearch.Each index=playersIndex}}
      <li>Name of the player: {{name}} ({{score}})</li>
    {{/EasySearch.Each}}
  </ul>

  {{> EasySearch.LoadMore index=playersIndex}}

  {{#EasySearch.IfNoResults index=playersIndex}}
    <div class="no-results">No results found!</div>
  {{/EasySearch.IfNoResults}}
</template>
{% endraw %}
```

All the components are prefixed with `EasySearch` to prevent namespace collisions. This HTML snippet provides you with a fully functional
search app that contains an `Input` to enter the search keywords, an `Each` that loops through the found results an `LoadMore` button that loads
more documents on request and a condition to display *No results found!* if there are no results.

This is doesn't need more code because EasySearch takes over the logic that controls the state of your search app while providing a lot of
[customization possibilities](../docs/components/). It stores the search options, search string and takes over things such as stopping unnecessary
subscriptions and so on.

You might notice that all the components have an `index` parameter, whose value simply is the index that should be acted upon.

```javascript
Template.search.helpers({
  playersIndex: () => PlayersIndex // instanceof EasySearch.Index
});
```
