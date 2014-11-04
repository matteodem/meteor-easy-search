Easy Search
=====================

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Use the Blaze Components + Javascript API to [get started](https://github.com/matteodem/meteor-easy-search/wiki/Getting-started). Since v1.0 it uses MongoDB for searching by default, but if you want to go for a mature search engine you can use [Elastic Search](https://github.com/matteodem/meteor-easy-search/wiki/Using-Elastic-Search).

```javascript
// On Client and Server
Players = new Meteor.Collection('players');
// name is the field to search over
Players.initEasySearch('name');
```

```html
<template name="searchBox">
    {{> esInput index="players" placeholder="Search..." }}

    {{#esEach index="players"}}
        {{> player}}
    {{/esEach}}
</template>
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have a look at the [Documentation](https://github.com/matteodem/meteor-easy-search/wiki) for more information.

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-search
```
