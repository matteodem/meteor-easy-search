Easy Search Elasticsearch
=====================

This package adds an `EasySearch.ElasticSearch` engine to Easy-Search. Easy-Search synchronizes documents to an index called
__easysearch__, with types based on the collection name.

```javascript
// On Client and Server
let Players = new Meteor.Collection('players'),
  PlayersIndex = new EasySearch.Index({
    collection: Players,
    fields: ['name'],
    engine: new EasySearch.ElasticSearch({
      body: () => { ... } // modify the body that's sent when searching 
    })
  });
```

## How to install

```sh
cd /path/to/project
meteor add easysearch:elasticsearch
```
