EasySearch Client Methods
=========================

**Overview:** These are all the methods exposed to the Client.

**Author:** Matteo De Micheli


EasySearch.createSearchIndex(name, options)
-------------------------------------------
Create a search "index" to search on.

**Parameters**

**name**:  *String*,  


**options**:  *Object*,  


EasySearch.search(name, searchString, callback)
-----------------------------------------------
Search over one of the defined indexes.

**Parameters**

**name**:  *String*,  


**searchString**:  *String*,  


**callback**:  *function*,  


EasySearch.searchMultiple(indexes, searchString, callback)
----------------------------------------------------------
Search over multiple indexes.

**Parameters**

**indexes**:  *Array*,  


**searchString**:  *String*,  


**callback**:  *function*,  


EasySearch.changeProperty(name, key, value)
-------------------------------------------
Allow easily changing properties (for example the global search fields).

**Parameters**

**name**:  *String*,  


**key**:  *String*,  


**value**:  *Object*,  


EasySearch.getIndex(name)
-------------------------
Retrieve a specific index configuration.

**Parameters**

**name**:  *String*,  


**Returns**

*Object*,  


EasySearch.getIndexes()
-----------------------
Retrieve all index configurations

**Returns**

*Array*,  


