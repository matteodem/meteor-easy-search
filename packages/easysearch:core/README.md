Easy Search Core
=====================

The core package allows you to search indexes with configured engines through the Javascript API.

```javascript
// On Client and Server
let Players = new Meteor.Collection('players'),
  PlayersIndex = new EasySearch.Index({
    collection: Players,
    fields: ['name'],
    engine: new EasySearch.MongoDB()
  });

Tracker.autorun(() => {
  let cursor = PlayersIndex.search('Peter');
  
  console.log(cursor.fetch()); // logs the documents
  console.log(cursor.count()); // logs the count of all matched documents
});
```

Check out the [searchable leaderboard example](https://github.com/matteodem/easy-search-leaderboard) or have a look at the
[Documentation](http://matteodem.github.io/meteor-easy-search/) for more information.

## How to install

```sh
cd /path/to/project
meteor add easysearch:core
```
