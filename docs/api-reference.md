---
layout: doc
title: API Reference
order: 6
---

## Core

### Index

```javascript
new EasySearch.Index(configuration)
```

Constructor for creating an index.

#### Configuration

* __collection__: Required, data that contains the searchable data
* __fields__: Required, fields to search for on the document
* __engine__: Required, engine to use for search
* __permission(options)__: Manage permission by returning a boolean
* __defaultSearchOptions__: The default search options as an object

```javascript
index.search(searchDefinition, [options])
```

Search the index with the given search definition.

#### searchDefinition

A search string (or object for [mongo based engines](../engines/)) that defines what to search for.

#### options

* __limit__: Limit as a number, by default 10
* __skip__:  Offset as a number, by default 0
* __props__: An object of custom props, such as facets and other

## Components

### Index

```javascript
index.getComponentDict([componentName])
```

Get a component dictionary that is a ReactiveDict used for searching by the EasySearch Components.

### componentName

Name of the component as a string

```javascript
index.getComponentMethods([componentName])
```

Returns an object of convenient methods for search that the EasySearch Components also use.

### componentName

Name of the component as a string
