Easy Search Autosuggest
=====================

This package adds an autosuggest blaze component that uses __selectize__ (`jeremy:selectize`) to handle the display logic itself and 
__EasySearch__ for the search.

```html
<template name="awesomeAutosuggest">
  <!-- searchIndex typeof EasySearch.Index -->
  {{> EasySearch.Autosuggest index=searchIndex }}
</template>
```

## How to install

```sh
cd /path/to/project
meteor add easysearch:autosuggest
```
