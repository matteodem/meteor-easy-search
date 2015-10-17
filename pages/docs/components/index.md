---
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
{{> EasySearch.Input index=myIndex}}
```

#### Parameters

* __attributes__: An object containing the input attributes (e.g. `{ placeholder: "Search for this" }`)
* __timeout__: Number of ms to wait until search starts


### FieldInput

Is the same as `EasySearch.Input`, but lets you search in a specified field. Allows to use multiple indexes.

```html
{{> EasySearch.FieldInput field="name" index=myIndex}}
```

#### Parameters

* __field__: Field that should be used for search
* __attributes__: Object with input attributes (e.g. `{ placeholder: "Search for this" }`)
* __timeout__: Number of ms to wait until search starts

### Each

Loops through the found documents if any are found.

```html
{{#EasySearch.Each index=myIndex}}
  <div class="result">{{someField}}</div>
{{/EasySearch.Each}}
```

### IfInputEmpty

Renders the content when the input that's associated with the index is empty. Allows multiple indexes.

```html
{{#EasySearch.IfInputEmpty index=myIndex}}
  <div>Start searching!</div>
{{/EasySearch.IfInputEmpty}}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### IfNoResults

Renders the content when there are no results found. Allows multiple indexes.

```html
{{#EasySearch.IfNoResults index=myIndex}}
  <div>No results found!</div>
{{/EasySearch.IfNoResults}}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### IfSearching

Renders the content when the associated input is being searched. Allows multiple indexes.

```html
{{#EasySearch.IfSearching index=myIndex}}
  <div>Searching...</div>
{{/EasySearch.IfSearching}}
```

#### Parameters
* __logic__: Logic to use when combining multiple indexes (_AND_ or _OR_)

### LoadMore

Renders a `<button>` tag that loads more documents if there are more than currently displayed.

```html
{{> EasySearch.LoadMore index=myIndex content="Load more content"}}
```

#### Parameters

* __content__: The content of the button
* __attributes__: Object with the button attributes (e.g. `{ class: "load-more-button" }`)

### Pagination

Renders an unordered list that displays pages to navigate through if there are more documents than current displayed.

```html
{{> EasySearch.Pagination index=myIndex maxPages=10}}
```

#### Parameters

* __prevAndNext__: If previous and next buttons should be displayed
* __maxPages__: Maximum count of pages to display
* __customRenderPagination__: Template to render the pagination with
* __transformPages__: Function to return a transformed array of pages before usage

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

The above example would be useable by just calling `{{> MySelectFilter}}` in your code. With Blaze Components you could create a component
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

This could be used by calling `{{> MySelectFilter index=index}}` or with multiple indexes.
