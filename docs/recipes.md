---
layout: doc
title: Recipes
order: 4
---

This is a cookbook containing recipes on how to use EasySearch for different scenarios in your app.
This article assumes you have read the [Getting started](../../getting-started/) page beforehand.

## Filtering with user data

Since EasySearch runs your code on both on the server and the client (if the engine searches on the server), you cannot always use
`Meteor.userId()` inside your code. EasySearch sets the userId in the options object at a consistent place for you. Let's assume you want
to only make docs searchable that belong to the logged in user. With `MongoDB` you would rewrite the default selector like following.

For the following code to work you need to use one of the [accounts packages](https://atmospherejs.com/packages/accounts) in your app.

```javascript
// Client and Server
let index = new EasySearch.Index({
  ...
  engine: new EasySearch.MongoDB({
    selector(searchDefinition, options) {
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
let index = new EasySearch.Index({
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
})
```

## Adding facets to your search app

Adding facets to your application to filter out certain result sets is easy. First create a `<select>` box or anything else
that you want to use to determine what to filter for.

```Javascript
let index = new EasySearch.Index({
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
