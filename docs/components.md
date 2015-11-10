---
layout: doc
title: Components
order: 2
---

The Blaze components provide you with an input, the results view, logic to add loading spinners and more. Those are also customizable
and should be sufficient for most use cases. The components can be used in the `easy:search` package which wraps the core and
`easysearch:components` into one.

## List of components

All the components require you to add an __index__ parameter which is the index instance that it should act on. Certain components
allow you to specify an array of __indexes__ to pass in. You can also specify a __name__ when you want to have multiple components
of an index on the same page.

### Input

Renders an `<input>` tag that searches the specified index(es). It searches through all the configured `fields` on your index.
Allows to use multiple indexes.

```html
{% raw %}
{{> EasySearch.Input index=myIndex}}
{% endraw %}
```

#### Parameters

* __attributes__: Object containing input attributes (e.g. `{ placeholder: "Search..." }`)
* __timeout__: Number of ms to wait until search starts
* __event__: Can be `enter`, if it only should search on enter


### FieldInput

Is the same as `EasySearch.Input`, but lets you search in a specified field. Allows to use multiple indexes.

```html
{% raw %}
{{> EasySearch.FieldInput field="name" index=myIndex}}
{% endraw %}
```

#### Parameters

* __field__: Field that should be used for search
* __attributes__: Object with input attributes (e.g. `{ placeholder: "Search for this" }`)
* __timeout__: Number of ms to wait until search starts
* __event__: Can be `enter`, if it only should search on enter

### Each

Loops through the found documents if any are found.

```html
{% raw %}
{{#EasySearch.Each index=myIndex}}
  <div class="result">{{someField}}</div>
{{/EasySearch.Each}}
{% endraw %}
```

### IfInputEmpty

Renders the content when the input that's associated with the index is empty. Allows multiple indexes.

```html
{% raw %}
{{#EasySearch.IfInputEmpty index=myIndex}}
  <div>Start searching!</div>
{{/EasySearch.IfInputEmpty}}
{% endraw %}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### IfNoResults

Renders the content when there are no results found. Allows multiple indexes.

```html
{% raw %}
{{#EasySearch.IfNoResults index=myIndex}}
  <div>No results found!</div>
{{/EasySearch.IfNoResults}}
{% endraw %}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### IfSearching

Renders the content when the associated input is being searched. Allows multiple indexes.

```html
{% raw %}
{{#EasySearch.IfSearching index=myIndex}}
  <div>Searching...</div>
{{/EasySearch.IfSearching}}
{% endraw %}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### LoadMore

Renders a `<button>` tag that loads more documents if there are more than currently displayed.

```html
{% raw %}
{{> EasySearch.LoadMore index=myIndex content="Load more content"}}
{% endraw %}
```

#### Parameters

* __content__: The content of the button
* __attributes__: Object with the button attributes (e.g. `{ class: "load-more-button" }`)
* __count__: Number of documents to load

### Pagination

Renders an unordered list that displays pages to navigate through if there are more documents than current displayed.

```html
{% raw %}
{{> EasySearch.Pagination index=myIndex maxPages=10}}
{% endraw %}
```

#### Parameters

* __prevAndNext__: If previous and next buttons should be displayed
* __maxPages__: Maximum count of pages to display
* __customRenderPagination__: Template to render the pagination with
* __transformPages__: Function to return a transformed array of pages before usage

## Retrieving component values

You can retrieve component values, such as the current search string by using the index method `getComponentDict`.

```javascript
// Assuming you either use EasySearch.Input or EasySearch.FieldInput inside your app

Template.searchBox.onRendered(() => {
  // index instanceof EasySearch.index
  let dict = index.getComponentDict(/* optional name */);

  // get the total count of search results, useful when displaying additional information
  console.log(dict.get('count'));
});
```

The components use the dictionary themselves to store reactive state. You can retrieve following values through the dictionary.

* __searchDefinition__: Search definition, mostly strings that are used to call `search`
* __searchOptions__: Options array to give in (e.g. props)
* __limit__: Count of search results to limit
* __skip__: Count of search results to skip
* __count__: Count of all found search results
* __currentCount__: Count of currently displayed search results
* __searching__: True if components are searching

## Using component methods

The components also use component methods that contain the core logic, such as searching with an input and so on. The index method
`getComponentMethods` exposes those.

```javascript
Template.filterBox.events({
  'change select': (e) => {
    // index instanceof EasySearch.index
    index.getComponentMethods(/* optional name */)
      .addProps('countryFilter', $(e.target).val())
    ;
  }
});
```

This code adds a custom property that is called `countryFilter` and the value of a country code.
You can log the object that `getComponentMethods` returns to see the complete list of available methods.

## Extensibility

The components are written with [Blaze Components](https://atmospherejs.com/peerlibrary/blaze-components) which offer a great way to
re-use functionality by using ES2015 classes and its power of reusability while still keeping the simplicity of Blaze.

Let's say you want to create a `<select>` component that sets custom properties when you change an option. With pure blaze you would
use the `getComponentMethods` method that's on the index.


```html
<template name="MySelectFilter">
    <select>
      <option value="awesome">Awesome</option>
      <option value="not-so-awesome">Not so awesome</option>
    </select>
</template>
```

```javascript
Template.MySelectFilter.events({
  'change select': function () {
    // myIndex instanceof EasySearch.Index
    myIndex
      .getComponentMethods()
      .addProps('awesomeFilter', $(e.target).val().trim())
    ;
  }
});
```

The above example would be useable by just calling `{% raw %}{{> MySelectFilter}}{% endraw %}` in your code. With Blaze Components you could create a component
that is useable for every index that supports the awesomeFilter.

```javascript
class MySelectFilterComponent extends EasySearch.BaseComponent {
  events() {
    return [{
      'change select' : function (e) {
        let selectedValue = $(e.target).val().trim();

        this.eachIndex((index, name) => {
          index
            .getComponentMethods(name)
            .addProps('awesomeFilter', selectedValue)
          ;
        });
      }
    }];
  }
}

MySelectFilterComponent.register('MySelectFilter');
```

This could be used by calling `{% raw %}{{> MySelectFilter index=index}}{% endraw %}` or with multiple indexes.
