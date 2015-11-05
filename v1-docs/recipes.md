---
layout: doc
title: Recipes
---

Here you can find instructions on different search features you might want to add to your app.

### Search the Users Collection

If you want to search through the Meteor.users collection you have to make use of the query method property. You can
further specify the selector as you do for faceting, filtering your search. Since you have to handle nested objects,
we use the __$elemMatch__ selector.

```javascript
EasySearch.createSearchIndex('users', {
  field: 'username',
  collection: Meteor.users,
  use: 'mongo-db',
  query: function (searchString, opts) {
    // Default query that is used for searching
    var query = EasySearch.getSearcher(this.use).defaultQuery(this, searchString);

    // Make the emails searchable
    query.$or.push({
      emails: {
        $elemMatch: {
          address: { '$regex' : '.*' + searchString + '.*', '$options' : 'i' }
        }
      }
    });

    return query;
  }
});
```

### Loading more content

You can easily load more content by using either ```esLoadMoreButton``` or ```esPagination```. The advantage of using the load more buton is that
it's easy to navigate, but it loads a lot more documents and uses more disk space than the paginatable solution. Simply use them like this:


```html
{% raw %}
<div class="search-controls">
    {{> esLoadMoreButton index="players"}}
    <!-- or -->
    {{> esPagination index="players"}}
</div>
{% endraw %}
```

### Searching on custom events

If you want to have the functionality of all the Blaze Components, without searching inside an input, you can use the
search method on the [component instance]({{ site.baseurl }}/docs/component-api). This allows you to react on any custom
Javascript Event, for example clicking on a picture of a player to load all his latest matches with an EasySearch Index.


```javascript

Template.players.events({
  'click .playerBox': function () {
    EasySearch
      .getComponentInstance({ index: 'players' })
      .search(this._id)
    ;
  }
});

```

This let's you use all the functionality of EasySearch but without the need of only searching through an input.

### Enhancing document fields

With Elastic-Search and other Search Indexes you generally try to have as much information in a document than possible.
This means you have to let go of normalization and instead focus on fields you would want for a better search experience.
If you for example have a __firstName__ and __lastName__ field in your Mongo docs, but you want users to search over their
full name, you could do it with ```transform```

```javascript
EasySearch.createSearchIndex('employees', {
   use: 'elastic-search', // mongo-db and minimongo won't work
   field: 'fullName',
   transform: function (doc) {
     doc.fullName = doc.firstName + ' ' + doc.lastName;
   }
});
```

This creates a new property called __fullName__, which is only used for indexing and searching. It is also a good idea
to add new fields for sorting. If you want to have the same functionality with mongo-db, you need to add those
fields to your docs.

### Searching with Mongo Text Indexes

If you want to stay true to MongoDB you can use text indexes to get enhanced search functionality. It is a good idea to sort by
`textScore`, which is the most relevant document that matches your search.


```javascript
EasySearch.createSearchIndex('employees', {
   use: 'mongo-db',
   useTextIndexes: true, // use mongo text indexes
   field: 'fullName', // field to use text indexes for
   sort: function () {
    return {
      score: { $meta: 'textScore' } // sort by relevance
    };
   }
});
```

### Filters / Faceted Search

You can easily implement filters and faceted search with Easy-Search. Let's say you want to filter for different categories, you would probably do it like this.

```html
{% raw %}
<template name="filters">
  ...
  <div class="filters">
    <div class="filter">Nike</div>
    <div class="filter">Adidas</div>
    <div class="filter">Puma</div>
  </div>
  ...
</template>
{% endraw %}
```

Clicking on one of those filter buttons will re-trigger the search when adding following JS code.

```javascript
// On Client and Server
EasySearch.createSearchIndex('cars', {
  'field' : ['name', 'description'],
  'collection' : Products,
  'props' : {
    'filteredCategories' : []
  },
  'query' : function (searchString) {
    // Default query that will be used for searching
    var query = EasySearch.getSearcher(this.use).defaultQuery(this, searchString);

    // filter for categories if set
    if (this.props.filteredCategories.length > 0) {
      query.categories = { $in : this.props.filteredCategories };
    }

    return query;
  }
});

// Only on Client
if (Meteor.isClient) {
  Template.filters.events({
    'click .filter' : function () {
      var instance = EasySearch.getComponentInstance(
        { index : 'cars' }
      );

      ...

      // Change the currently filteredCategories like this
      EasySearch.changeProperty('cars', 'filteredCategories', categories);
      // Trigger the search again, to reload the new products
      instance.triggerSearch();
    }
  });
}
```

With the help of ```changeProperty``` you can change the configuration values set in ```createSearchIndex``` and then re-trigger the search with ```triggerSearch``` on the component instance.
This will run through the custom query defined and since it has an if statement that covers filters, it'll only return results where the products are in one of the selected cateogries.

See the [Easy-Search Leaderboard](https://github.com/matteodem/easy-search-leaderboard) for a working example of this.
