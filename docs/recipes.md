---
layout: doc
title: Recipes
---

Here you can find instructions on different search features you might want to add to your app.

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
      EasySearch.changeProperty('products', 'filteredCategories', categories);
      // Trigger the search again, to reload the new products
      instance.triggerSearch();
    }
  });
}
```

With the help of ```changeProperty``` you can change the configuration values set in ```createSearchIndex``` and then re-trigger the search with ```triggerSearch``` on the component instance. 
This will run through the custom query defined and since it has an if statement that covers filters, it'll only return results where the products are in one of the selected cateogries.

See the [Easy-Search Leaderboard](https://github.com/matteodem/easy-search-leaderboard) for a working example of this.
