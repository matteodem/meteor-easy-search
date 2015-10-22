Easy Search [![Build Status](https://travis-ci.org/matteodem/meteor-easy-search.svg?branch=master)](https://travis-ci.org/matteodem/meteor-easy-search)
=====================

[![Meteor Icon](http://icon.meteor.com/package/easy:search)](https://atmospherejs.com/easy/search)

Easy Search is a simple and flexible solution for adding search functionality to your Meteor App. Use the Blaze Components + Javascript API to [get started](http://matteodem.github.io/meteor-easy-search/getting-started).

```javascript
// On Client and Server
let Players = new Meteor.Collection('players'),
  PlayersIndex = new EasySearch.Index({
    collection: Players,
    fields: ['name'],
    engine: new EasySearch.MongoDB()
  });

Template.searchBox.helpers({
  playersIndex: () => PlayersIndex
});
```

```html
<template name="searchBox">
    {{> EasySearch.Input index=playersIndex }}

    <ul>
        {{#EasySearch.Each index=playersIndex }}
            <li>Name of the player: {{name}}</li>
        {{/EasySearch.Each}}
    </ul>
</template>
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have a look at the [Documentation](http://matteodem.github.io/meteor-easy-search/) for more information.

## How to install

```sh
cd /path/to/project
meteor add easy:search
```
