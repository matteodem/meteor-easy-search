EasySearch Server Methods
=========================

**Overview:** These are all the methods exposed on the Server.

**Author:** Matteo De Micheli

This is the Public API on the Server. 

EasySearch.config(newConfig)
----------------------------
Override the config for Elastic Search.

**Parameters**

**newConfig**:  *object*,  


EasySearch.createSearchIndex(name, options)
-------------------------------------------
Create a search index for use with Elastic Search.

**Parameters**

**name**:  *String*,  


**options**:  *Object*,  


EasySearch.getMongoDocumentObject(data)
---------------------------------------
Get a fake representation of a mongo document.

**Parameters**

**data**:  *Object*,  


**Returns**

*Array*,  


EasySearch.search(name, searchString, options, callback)
--------------------------------------------------------
Perform a search.

**Parameters**

**name**:  *String*,  the search index

**searchString**:  *String*,  the string to be searched

**options**:  *Object*,  defined with createSearchInde

**callback**:  *function*,  optional callback to be used

EasySearch.getElasticSearchClient()
-----------------------------------
Get the ElasticSearchClient

**Returns**

*ElasticSearchInstance*,  


EasySearch.getIndexes()
-----------------------
Retrieve all index configurations

EasySearch.extendSearch(key, methods)
-------------------------------------
Makes it possible to override or extend the different
types of search to use with EasySearch (the "use" property)
when using EasySearch.createSearchIndex()

**Parameters**

**key**:  *String*,  Type, e.g. mongo-db, elastic-search

**methods**:  *Object*,  Methods to be used, only 2 are required:
                         - createSearchIndex (name, options)
                         - search (name, searchString, [options, callback])

