---
layout: doc
title: Elastic Search
---

You can use the Elastic-Search Engine by adding following:

```javascript
EasySearch.createSearchIndex('cars', {
    ...
    'use' : 'elastic-search'
    ...
});
```

Using Elastic Search not only gives you the possibility to customize the search a lot more, but it also gives you a lot more speed for more complicated search queries.

### How to install

```sh

# Install Elastic Search through brew.
brew install elasticsearch
# Start the service, runs on http://localhost:9200 by default.
elasticsearch -f -D es.config=/usr/local/opt/elasticsearch/config/elasticsearch.yml
```

### Configuration

Call ``config`` on the Server to configure the host and more, see [Elastic Search Configuration](http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html)

```javascript
// On Server
EasySearch.config({
    'host' : 'localhost:8800',
    ...
});
```

### Differences to using Mongo DB

There are some little differences to when using the default Mongo DB implementation:

For ``EasySearch.createSearchIndex``:

* the ``query`` parameter returns an [Elastic Search Query Object](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-query.html)
* the ``sort`` parameter returns an [Elastic Search Sort Object](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-body.html)
* there's a ``body`` parameter which lets you allow to add additional options to the body of your request

The default is a [fuzzy like this](http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-flt-query.html) query. You can still
override it with the ``query`` parameter if you want to.


### Using the ElasticSearch Client directly

If you want to use the Node ElasticSearch Client, you can do it like this.

```javascript
var client = new EasySearch.ElasticSearch.Client({
   host: 'localhost:9200'
});

client.search({
   index: 'players',
   // EasySearch uses 'default' as the type, when creating the index
   type: 'default',
   body: {
      query: {
          match: {
              name: 'Grace'
          }
       }
    }
}).then(function (response) {
   console.log(response.hits.hits);
}, function (err) {
   console.trace(err.message);
});
```
