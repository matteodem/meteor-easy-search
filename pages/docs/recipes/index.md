---
title: Recipes
order: 4
---

This is a cookbook containing recipes on how to use EasySearch for different scenarios in your app.

## Searching user mails

If you want to search through the mails of `Meteor.users` you can do it by using a custom selector with `$elemMatch`.

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
