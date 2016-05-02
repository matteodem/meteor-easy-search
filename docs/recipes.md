---
layout: doc
title: Recipes
order: 4
---

This is a cookbook containing recipes on how to use EasySearch for different scenarios in your app.
This article assumes you have read the [Getting started](../../getting-started/) page beforehand.

## Filtering user data

Since EasySearch runs your code on both on the server and the client (if the engine searches on the server), you cannot always use
`Meteor.userId()` inside your code. EasySearch sets the userId in the options object at a consistent place for you. Let's assume you want
to only make docs searchable that belong to the logged in user. With `MongoDB` you would rewrite the default selector like following.

For the following code to work you need to use one of the [accounts packages](https://atmospherejs.com/packages/accounts) in your app.

```javascript
// Client and Server
let index = new EasySearch.Index({
  ...
  engine: new EasySearch.MongoDB({
    selector(searchDefinition, options, aggregation) {
      // retrieve the default selector
      let selector = this
        .defaultConfiguration()
        .selector(searchObject, options, aggregation)
      ;

      // options.search.userId contains the userId of the logged in user
      selector.owner = options.search.userId;

      return selector;
    }
  }),
  permission(options) {
    return options.userId; // only allow searching when the user is logged in
  }
});
```

`permission` is configured to only let logged in user search and the `selector` method filters searchable docs where `owner` equals the
logged in userId.

## Modifying search results

EasySearch returns documents when using `search` that have the same fields as the original ones, but the `_id` is different.
If you want to perform changes on search result documents by the id you can use the `__originalId` which contains the original `_id`
of the document. So `collection.findOne(doc._id)` won't work, while `collection.findOne(doc.__originalId)` would.

```Javascript
Tracker.autorun(function () {
  // index instanceof EasySearch.Index
  let docs = index.search('angry').fetch();

  if (docs.length) {
    docs.forEach((doc) => {
      // originalId is the _id of the original document
      makeHappy(doc.__originalId);
    });
  }
})

```

This has to do with internal logic that EasySearch applies to keep search results and their orders separate from the collection that
they come from.

## Searching user mails

If you want to search through the mails of `Meteor.users` you can do it by using a custom mongo selector called `$elemMatch`.

```javascript
let index = new EasySearch.Index({
  ...
  fields: ['username', 'emails']
  selectorPerField: function (field, searchString) {
    if ('emails' === field) {
      // return this selector if the email field is being searched
      return {
        emails: {
          $elemMatch: {
            address: { '$regex' : '.*' + searchString + '.*', '$options' : 'i' }
          }
        }
      };
    }

    // use the default otherwise
    return this.defaultConfiguration().selectorPerField(field, searchString);
  }
});
```

This configuration returns a different selector if the configured `emails` fields is being searched and thus matches the actual email
address nested inside the object.

## Searching without an input

If you want to have the functionality of the Blaze Components without searching inside an input, you can use the search component method.
This allows you to react on any custom Javascript Event, for example clicking on a picture of a player to load all his latest matches with an EasySearch Index.

```Javascript
Template.players.events({
  'click .playerBox': function () {
    // index instanceof EasySearch.Index
    index
      .getComponentMethods(/* optional name if specified on the components */)
      .search(this._id)
    ;
  }
});
```

This let's you use all the functionality of EasySearch but without the need of only searching through an input.

## Adding additional data to your document

If you want to add relations to your documents you can use `beforePublish` that is used on the server side before the document is actually published. There is also the `transform` configuration that is useful if you want the existing document data to be transformed. Both of those configurations are on the engine level.

```javascript
const index = new EasySearch.Index({
  ...
  engine: new EasySearch.MongoDB({
    beforePublish: (action, doc) {
      // might be that the field is already published and it's being modified
      if (!doc.owner && doc.ownerId) {
        doc.owner = Meteor.users.findOne({ _id: doc.ownerId });
      }

      // always return the document
      return doc;
    },
    transform: (doc) {
      doc.slug = sluggify(doc.awesomeName);

      // always return the document
      return doc;
    }
  })
});
```

## Adding facets to your search app

Adding facets to your application to filter out certain result sets is easy. First create a `<select>` box or anything else
that you want to use to determine what to filter for.

```Javascript
const index = new EasySearch.Index({
  ...
  engine: new EasySearch.MongoDB({
    selector: (searchObject, options, aggregation) {
      let selector = this.defaultConfiguration().selector(searchObject, options, aggregation);

      // filter for the brand if set
      if (options.search.props.brand) {
        selector.brand = options.search.props.brand;
      }

      return selector;
    }
  })
});
```

```html
<template name="filters">
  ...
  <select class="filters">
    <option value="nike">Nike</option>
    <option value="adidas">Adidas</option>
    <option value="puma">Puma</option>
  </select>
  ...
</template>
```

Now add code that sets a custom property when the select changes it's selection.

```javascript
Template.filters.events({
  'change select': function (e) {
    shoeIndex.getComponentMethods(/* optional name */)
      .addProps('brand', $(e.target).val())
    ;
  }
})
```

Since the index is configured to filter for the brand if set this is enough to have a simple brand facet.

## Adding sorting to your app

Adding sorting to your search app is very similiar to how facets would be implemented.

```javascript
// On Client and Server
const carSearchIndex = new EasySearch.Index({
  collection: carCollection,
  fields: ['name', 'companyName'],
  defaultSearchOptions: {
    sortBy: 'relevance'
  },
  engine: new EasySearch.MongoDB({
    sort: function (searchObject, options) {
      const sortBy = options.search.props.sortBy;

      // return a mongo sort specifier
      if ('relevance' === sortBy) {
        return {
          relevance: -1
        };
      } else if ('newest' === sortBy) {
        return {
          createdAt: -1
        };
      } else if ('bestScore' === sortBy) {
        return {
          averageScore: -1
        };
      } else {
        throw new Meteor.Error('Invalid sort by prop passed');
      }
    }
  })
});
```

This code creates a `carSearchIndex` that checks if a sortBy prop is passed to the search query and throws an `Meteor.Error` if an invalid string is passed. Be sure to add the `defaultSearchOptions` so that there's no initial error when loading the components.

```html
{% raw %}
<template name="mySearchPage">
  {{> EasySearch.Input index=carsIndex}}

  <select class="sorting">
    <option value="relevance">Relevance</option>
    <option value="newest">Newest</option>
    <option value="bestScore">Score</option>
  </select>

  {{#EasySearch.Each index=carsIndex}}
    ...
  {{/EasySearch.Each}}
</template>
{% endraw %}
```

```js
// On Client
Template.mySearchPage.helpers({
  carsIndex: () => carSearchIndex
});

Template.mySearchPage.events({
  'change .sorting': (e) => {
    carSearchIndex
      .getComponentMethods()
      .addProps('sortBy', $(e.target).val())
    ;
  }
});
```

This following code executes code when the sorting select box is changed and adds the `sortBy` props which are used in the
index configuration to determine how to sort your search results. The `addProps` method also retriggers the search automatically.

## Using custom pagination

If you want to use custom pagination, use the `customRenderPagination` parameter for `EasySearch.Pagination`.


```html
{% raw %}
<template name="mySearchPage">
  {{> EasySearch.Input index=myIndex}}

  {{#EasySearch.Each index=myIndex}}
    ...
  {{/EasySearch.Each}}


  {{> EasySearch.Pagination index=myIndex customRenderPagination="myPagination"}}
</template>

<template name="myPagination">
  <ul class="pagination">
    {{#each page}} 
      <li class="page {{pageClasses this}}"> {{content}} </li>
     {{/each}}
  </ul>
</template>
{% endraw %}
```

As long as each page has a class called `page` the custom pagination will work as expected.

## Adding custom attributes to components

If you want to have custom attributes such as a html placeholder you can use the `attributes` property on some [components](../components).

```html
{% raw %}
<template name="mySearchPage">
  ...
  {{> EasySearch.Input index=myIndex attributes=inputAttributes}}
</template>
{% endraw %}
```

```js
// On Client
Template.mySearchPage.helpers({
  inputAttributes: () => {
    return {
      placeholder: 'Start searching with a number',
      type: 'number'
    };
  }
});
```

## Searching on composite fields

Let's say you have a field that is made up of several other fields. A good example for this would be a name, which is
made of the first name and surname. There's multiple ways to go about this, the simple solution would be to store the composite field denormalized in your collection.

```js
// On Client and Server
// using https://atmospherejs.com/matb33/collection-hooks

const myCollection = new Mongo.Collection('myCollection');

myCollection.before.insert(function (userId, doc) {
    if (doc.firstName && doc.lastName) {
      doc.fullName = doc.firstName + ' ' + doc.lastName;
    }

    return doc;
});

const myCollectionIndex = new EasySearch.Index({
  collection: myCollection,
  fields: ['fullName'],
  engine: new EasySearch.MongoDB()
});
```

If you're dealing with more complex data it might be better to create a read model such as a **separate search collection** or have an **ElasticSearch index** that's optimized for search.
