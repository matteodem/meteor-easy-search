---
title: Getting started
order: 0
---

In Easy Search you use an __index__ with a configured __engine__ to search through a specified Mongo Collection. Let's define those two things
before we continue.

### Engine

The engine contain is named after the backend that it uses to search. Every engine contains the  search logic required for the index to work,
but differs in the technology used to do so. There is an `EasySearch.MongoDB` engine for example, which uses MongoDB on the server and subscriptions
on the client to retrieve the data.
There are a lot predefined [engines](/docs/engines/) but you can easily create your own or extend existing ones.

### Index

An index holds more specific configuration such as which collection and documents fields are searchable. One part of the configuration is the engine
so the index knows how to actually search through the collection. The index is the main building block to creating search functionality for your app.

## Creating An Index

Let's create an index to see how searching works with Easy Search.

```javascript
// On Client and Server
Players = new Meteor.Collection('players');

PlayersIndex = new EasySearch.Index({
  collection: Players,
  fields: ['name', 'score'],
  engine: new EasySearch.Minimongo()
});
```

This configuration tells EasySearch to search through name and score on the Players collection. We told EasySearch to use
[Minimongo](/docs/engines/) as an engine. The Minimongo engine doesn't create new subscriptions and makes sense when you already have the data
that you need to search accessible on the client. If you want to search all the documents in the collection, use [MongoDB](/docs/engines/) as your engine.

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

Have a look at the [Core section](/docs/core/) to find out the many customization possibilities around searching.

## Adding Components

Easy Search also provides customizable Blaze Components out of the box.

```html
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
```

All the components are prefixed with `EasySearch` to prevent namespace collisions. This HTML snippet provides you with a fully functional
search app that contains an `Input` to enter the search keywords, an `Each` that loops through the found results an `LoadMore` button that loads
more documents on request and a condition to display *No results found!* if there are no results.

You might notice that all the components have an `index` parameter, whose value simply is the index that should be acted upon.

```javascript
Template.search.helpers({
  playersIndex: () => PlayersIndex
});
```
