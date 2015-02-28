Easy Search [![Build Status](https://travis-ci.org/matteodem/meteor-easy-search.svg?branch=master)](https://travis-ci.org/matteodem/meteor-easy-search)
=====================

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Use the Blaze Components + Javascript API to
[get started](http://matteodem.github.io/meteor-easy-search/getting-started). Since v1.0 it uses MongoDB for searching by default, but if you
want to go for a mature search engine you can use [Elastic Search](http://matteodem.github.io/meteor-easy-search/docs/elastic-search/).

```javascript
// On Client and Server
Players = new Meteor.Collection('players');
// name is the field of the documents to search over
Players.initEasySearch('name');
```

```html
<template name="searchBox">
    {{> esInput index="players" placeholder="Search..." }}

    <ul>
        {{#esEach index="players"}}
            <li>Name of the player: {{name}}</li>
        {{/esEach}}
    </ul>
</template>
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have a look at the
[Documentation](http://matteodem.github.io/meteor-easy-search/) for more information.

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-search
```
