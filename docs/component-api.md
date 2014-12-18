---
layout: page
title: Component API
---

### Handling Events

There are Component Events, which are built with the client side ```Session``` API. If you have a search input defined like this ```{{> esInput id="main" index="sites"}}```, then you could do following to react upon certain events.

```javascript
Template.searchbar.created = function () {
  var instance = EasySearch.getComponentInstance(
    { id : 'main', index : 'sites' }
  );

  instance.on('searchingDone', function (searchingIsDone) {
    searchingIsDone && console.log('I am done!');
  });

  instance.on('currentValue', function (val) {
    console.log('The user searches for ' + val);
  });
};
```

This sets up an autorun, which is re-run everytime the value of the "event" changes. Events that can be reacted on are stated under ___Available Values__. There's always a corresponding value which is changed and passed to the callback function.

### Retrieve Component Values

You can retrieve component values like following to work with them in your app.

```javascript
var instance;

Template.searchbar.rendered = function () {
  instance = EasySearch.getComponentInstance(
    { id : 'main', index : 'sites' }
  );
};

Template.searchbar.helpers({
  isSearching: function () {
    return instance.get('searching');
  }
}); 
```

### Clear the current search (reset)

You can reset all the values by using clear on the component.

```javascript
var instance = EasySearch.getComponentInstance(
  { id : 'main', index : 'sites' }
);

instance.clear();
```

### Triggering search

You can manually trigger search, useful for [faceted search](https://github.com/matteodem/meteor-easy-search/wiki/Faceted-Search), for example when trying to filter or sort.


```javascript
var instance = EasySearch.getComponentInstance(
  { id : 'main', index : 'sites' }
);

// change filter with changeProperty on the client

instance.triggerSearch();
```

### Available Values

Blaze Components can have following values associated with them.

* searching (true when a search is being performed)
* searchingDone (true when the search is done)
* currentValue (current search value as a string)
* searchResults (found results as an array for "currentValue")
* total (total amount of search results)
* currentLimit (the current limitation of search results)
* autosuggestSelected (the current suggestion(s) for autosuggest field)
