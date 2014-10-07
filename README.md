Easy Search
=====================

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Use the Blaze Components + Javascript API to [get started](https://github.com/matteodem/meteor-easy-search/wiki/Getting-started). Since v1.0 it uses MongoDB for searching by default, but if you want to go for a mature search engine you can use [Elastic Search](#using-elastic-search).

```javascript
// On Client and Server
Players = new Meteor.Collection('players');
// name is the field to search over
Players.initEasySearch('name');
```

```html
<template name="home">
    ...
    <div class="search-input">
        {{> esInput index="players" placeholder="Search..." }}
    </div>

    <div class="results-wrapper">
    {{#esEach index="players"}}
        {{> player}}
    {{/esEach}}
    </div>
    ...
</template>
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard).

Have a look at the [Documentation](https://github.com/matteodem/meteor-easy-search/wiki) for detailed information.

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-search
```
