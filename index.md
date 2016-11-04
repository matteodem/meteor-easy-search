---
layout: default
title: Home
---

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Read the documentation to [get started](getting-started).

```javascript
import { Index, MinimongoEngine } from 'meteor/easy:search'

// On Client and Server
const Players = new Mongo.Collection('players')
const PlayersIndex = new Index({
  collection: Players,
  fields: ['name'],
  engine: new MinimongoEngine()
})
```

```javascript
// On Client
Template.searchBox.helpers({
  playersIndex: () => PlayersIndex,
})
```

```html
{% raw %}
<template name="searchBox">
    {{> EasySearch.Input index=playersIndex }}
    <ul>
        {{#EasySearch.Each index=playersIndex }}
            <li>Name of the player: {{name}}</li>
        {{/EasySearch.Each}}
    </ul>
</template>
{% endraw %}
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) for a project implemented with EasySearch.
Documentation for v1 can be found [here](https://github.com/matteodem/meteor-easy-search/tree/gh-pages/_v1docs).

## How to install

```sh
cd /path/to/project
meteor add easy:search
```
