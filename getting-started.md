---
layout: page
title: Getting started
---

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. It can be easily integrated into existing apps
by providing a small set of APIs in Javascript and Blaze Components that cover basic search functionality.
In EasySearch you use __indexes__ together with __engines__ to search through a specified Mongo Collection.
Let's have a closer look at the two things and how they interact with each other.

## Creating An Index

The index is the main building block for creating search functionality in your app.
Let's create one to see how searching works with Easy Search. First add a file that's reachable both on the __client and server__
(for example `./indexes.js`).

```javascript
// On Client and Server
const Players = new Mongo.Collection('players');

const PlayersIndex = new EasySearch.Index({
  collection: Players,
  fields: ['name', 'score'],
  engine: new EasySearch.Minimongo()
});
```

There are three parts of configuration that need to be specified when creating an index:

* The Mongo Collection that provides the documents to search upon
* The document fields that are used for searching (search examples follow in the next section)
* The engine that implements the search behaviour

In this example we search through the name and score document fields with the documents in the Players collection.
We told EasySearch to use [Minimongo](../docs/engines/) as an engine. Minimongo doesn't create new subscriptions and
makes sense when you already have the documents that you need to search accessible on the client.
If you want to search all the documents in the collection, use [MongoDB](../docs/engines/) as your engine.

## Searching

Now that we got the index setup you can start searching through it.

```javascript
// On Client
Tracker.autorun(function () {
  let cursor = PlayersIndex.search('Marie'); // search all docs that contain "Marie" in the name or score field

  console.log(cursor.fetch()); // log found documents with default search limit
  console.log(cursor.count()); // log count of all found documents
});
```

This code snippet searches for "Marie" in the Players collection. Notice that this can only be executed on the client, because Minimongo
is a client only library. If we would use [MongoDB](../docs/engines) as an engine we could use it on both environments as an Isomorphic API.

The return value of the `search` method is always an `EasySearch.Cursor`. When you call `fetch` you retrieve an array of documents from the
specified collection. It is also possible to provide custom options when calling `search` as the second parameter.

```javascript
Tracker.autorun(function () {
  console.log(PlayersIndex.search('Marie', { limit: 5, skip: 10 }).fetch());
});
```

Those options limit the returned search results to 5 and skip the first 10 results.
Have a look at the [Core section](../docs/core/) to find out the many customization possibilities around searching, for example filtering
documents when searching with props.

## Adding Components

Easy Search also provides customizable [Blaze Components](../docs/components/) out of the box. These components provide basic search
functionality by using the Core Javascript API (that has been explained in _Creating An Index_ and _Searching_).

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

```javascript
Template.search.helpers({
  playersIndex: () => PlayersIndex // instanceof EasySearch.Index
});
```

This compact blaze snippet provides you with a fully functional
search app that contains an `Input` to enter the search keywords, an `Each` that loops through the found results an `LoadMore` button
that loads more documents on request and a condition to display *No results found!* if there are no results.

This is possible because EasySearch takes over the logic that controls the state of your search app while providing a lot of
[customization possibilities](../docs/components/). It stores the search options, search string and takes over tasks such as
stopping unnecessary subscriptions and so on, which might be forgotten when only using the Core Javascript API. You might also notice
that all the components have an `index` parameter, whose value simply is the index that should be acted upon.

## Where to read further

You have just built a basic search solution for your app by using the EasySearch Javascript API and it's Blaze Components. If you want to
know more about how you can configure your search index by adding filtering logic and so on, read through the [core](../docs/core) page. If
you'd like to see the full list of blaze components or the various parameters that they accept, have a look at [components](../docs/components).
[Recipes](../docs/recipes) provide you with many use cases that you might face when implementing search, similar to a cookbook.
