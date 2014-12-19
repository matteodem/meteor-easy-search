---
layout: doc
title: Autosuggest Field
---

The Easy Search Autosuggest Component can be of great help if you want to have a **select2-like** input field which let's you search through your Mongo.Collection.

```javascript
// On Client and Server
Players = new Meteor.Collection('players');

// name is the field to search over
Players.initEasySearch(['name', 'score']);
```
```html
{% raw %}
<template name="playersOverview">
    {{> esAutosuggest index="players" renderSuggestion=suggestion }}
    ...
</template>

<template name="suggestionTpl">
    <!-- Default way of ES rendering the suggestions -->
    {{pre}}<span class="found">{{found}}</span>{{post}}
    <!-- "doc" gives access to the suggested document -->
    {{doc.score}}
</template>
{% endraw %}
```

Set up the client javascript code like following to react upon every selection change + the custom suggestion render template.

```javascript
// Only client
Template.playersOverview.created = function () {
  // set up reactive computation
  this.autorun(function () {
    var instance = EasySearch.getComponentInstance(
        { index : 'players' }
    );

    instance.on('autosuggestSelected', function (values) {
      // run every time the autosuggest selection changes
    });
  });
});
Template.playersOverview.helpers({
  'suggestion' : function () {
     return Template.suggestionTpl;
  }
});
```

Have a look at [Component API]({{ site.baseurl }}/docs/component-api) for more information about the "instance.on" method.