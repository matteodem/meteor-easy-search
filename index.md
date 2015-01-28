---
layout: default
title: Home
---

Easy Search is a simple and flexible solution for adding Search Components to your Meteor App. Use the Blaze Components + Javascript API to [get started]({{ site.baseurl }}/getting-started). 

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

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have at the sidebar for more information.

## How to install

```sh
cd /path/to/project
meteor add matteodem:easy-search
```
