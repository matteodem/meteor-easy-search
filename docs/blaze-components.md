---
layout: doc
title: Blaze Components
---


You can add a text input, the search results view, the loading bar and
more with the provided Components.

```html
{% raw %}
<template name="searchTpl">
    <div class="search-input">
        {{> esInput index="players" placeholder="Search..." }}
    </div>

    {{#ifEsInputIsEmpty index="players"}}
        <div>Search for players</div>
    {{/ifEsInputIsEmpty}}

    {{#ifEsIsSearching index="players"}}
        <div>Loading...</div>
    {{else}}
        <div class="results-wrapper">
            {{#esEach index="players"}}
                {{> player}}
            {{/esEach}}
        </div>
        
        {{> esLoadMoreButton index="players"}}
    {{/ifEsIsSearching}}

    {{#ifEsHasNoResults index="players"}}
        <div class="no-results">No results found!</div>
    {{/ifEsHasNoResults}}
</template>
{% endraw %}
```

### esInput

**Parameters**

* index (required, the index name)
* class (not required, additional classes)
* id (not required, id of the input)
* placeholder (not required, placeholder)
* event (not required, the event to listen on (only "enter" or "keyup" for now))
* reactive (default true, make the search not reactive if wished)
* timeout (not required, when to start the search after keyup)

esInput provides you with a text input field. It doesn't make a lot of sense unless you use it together
with esEach (the #each for search indexes).

**Tips**

* Only add an id parameter when you have 2 or more search components on the same index
* Setting "reactive" to false can make the search faster

### esEach

**Parameters**

* index (required, the index name)
* id (only required when also added to the esInput, will not render an HTML id!)
* options (not required, the options for the find cursor, [see here](http://docs.meteor.com/#find))

A way to render each found search item, having the document with all its data.

### esLoadMoreButton

**Parameters**

* index (required, the index name)
* id (only required when also added to the esInput)
* howMany (not required, how many docs should be loaded)
* content (not required, the content of the load more button)
* class (not required, additional classes)

Making it possible to load more documents with a load more button.

### esAutosuggest

**Parameters**

* index (required, the index name)
* class (not required, additional classes)
* id (not required, id of the input)
* placeholder (not required, placeholder)
* event (not required, the event to listen on (only "enter" or "keyup" for now))
* reactive (default true, make the search not reactive if wished)
* timeout (not required, when to start the search after keyup)
* options (not required, the options for the find cursor, [see here](http://docs.meteor.com/#find))
* renderSuggestion (not required, a string for a ``<template>`` to render each suggestion)

Creates a fully self working autosuggest field, which renders suggestions and lets them add you 
with arrow-down and up, enter and remove them with backspace.

You can get your selected autosuggest values like this.
```javascript
// On Client
var values = $('.myAutosuggestInput').esAutosuggestData();
````

### ifEsIsSearching

**Parameters**

* index (required, the index name(s))
* id (only required when also added to the esInput, will not render an HTML id!)
* logic (not required, combine more than one indexes by "OR" or "AND")

Show certain content when a search is performed. For example when you got an
input for a specified ```index``` you would have to specify the same ```index```
parameter.

### ifEsInputIsEmpty

**Parameters**

* index (required, the index name)
* id (only required when also added to the esInput, will not render an HTML id!)

Show certain content when an ```esAutosuggest``` field is empty.

### ifEsHasNoResults

**Parameters**

* index (required, the index name(s))
* id (only required when also added to the esInput, will not render an HTML id!)
* logic (not required, combine more than one indexes by "OR" or "AND")

Show "no results found" content after the search has been performed.

### Components with multiple indexes

If you want to search over multiple indexes Blaze Components, you can simply change the index
parameter to an array and define one ``esEach`` loop for each index defined.

```html
{% raw %}
<div class="search-input">
     <!-- indexes is a javascript array which holds 'players' and 'cars' -->
     {{> esInput index=indexes placeholder="Search..." }}
</div>
<div class="results-wrapper">
     {{#esEach index="players"}}
         {{> player}}
     {{/esEach}}
	
     {{#esEach index="cars"}}
         {{> car}}
     {{/esEach}}
</div>
{% endraw %}
```
