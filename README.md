Easy Search 
=====================

Easy Search is a simple and flexible solution for adding search functionality to your Meteor App. Use the Blaze Components + Javascript API to [get started](http://matteodem.github.io/meteor-easy-search/getting-started).

In this fork we have added some options to the mongo-db engine in order to deal with big queries.

```javascript
import { Index, MongoDBEngine } from 'meteor/easy:search'

// On Client and Server
const Players = new Mongo.Collection('players')
const PlayersIndex = new Index({
  collection: Players,
  fields: ['name'],
  engine: new MongoDBEngine({
    /* sort, and selector as default */
    /* the following paramters are documented in the meteor docs */
    disableOplog: true,
    pollingIntervalMs: 10000,
    pollingThrottleMs: 1000,
    maxTimeMs: 30000,
  }),
  // added: make the index reactive
  reactive: false,
  // make the count updated, only applicable if reactive:true
  countUpdateIntervalMs: 0,
})
```

The parameters of the `engine` are documented
[here](https://docs.meteor.com/api/collections.html#Mongo-Collection-find).

The parameters on the index `reactive` is used to indicate reactivity of the queries. If false, the observer handler stops after first completion

Now, when using `MongoTextEngine` we can sort by `textScore`, and specify the
weights for the fields:

```javascript
import { Index, MongoDBEngine } from 'meteor/easy:search'

// On Client and Server
const Players = new Mongo.Collection('players')
const PlayersIndex = new Index({
  collection: Players,
  fields: ['name'],
  engine: new MongoTextIndex({
    sort: function () {
      return {"score": { "$meta": "textScore" }, "pub_date": -1};
    },
  }),
  weights: function () {
      return {"title": 10, "categories": 10, "keywords": 10, "raw_text": 5};
  },
)};
```
By default, if using `MongoTextIndex` the sort and projection is set to: `{"score": { "$meta": "textScore" }}`


```javascript
// On Client
Template.searchBox.helpers({
  playersIndex: () => PlayersIndex,
});
```

```html
<template name="searchBox">
    {{> EasySearch.Input index=playersIndex matchAll=1 autoSearch=0}}

    <ul>
        {{#EasySearch.Each index=playersIndex }}
            <li>Name of the player: {{name}}</li>
        {{/EasySearch.Each}}
    </ul>
</template>
```

This fork has added matchAll and reactive options which are not documented on
the original documentation.

* `matchAll=1`: the search string will be converted to words with quotes. In Mongo
this implies that ALL the words are required. For example "this is my search"
will be converted to ""this" "is" "my" "search"".

* `autoSearch=0`: enable or disable the search while writing

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have a look at the [current documentation](http://matteodem.github.io/meteor-easy-search/) ([v1 docs](https://github.com/matteodem/meteor-easy-search/tree/gh-pages/_v1docs)) for more information.

## How to install

```sh
cd /path/to/project
meteor add easy:search
```
