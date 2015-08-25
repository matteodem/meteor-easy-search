1.6.3
=====
* Change less dependency to accept 1.* and 2.* 

1.6.2
=====
* Fixed #257: Optional `pos` field for autosuggest
* Fixed #217 from [@renato0307](https://github.com/renato0307): Custom renderControl template for pagination

1.6.1
=====

* Changed #249: Update elasticsearch npm dependency 

1.6.0
=====

* Added #183: Support for sorting by textScore when mongo text indexes are used
* Merged #235 from [@TPXP](https://github.com/TPXP): Allow to set default values on esInput
* Fixed #222: Set isSearching to true if esInput is empty
* Fixed #198: Also subscribe to documents count if esInput is not used
* Fixed #214: Enable Previous button in pagination after more than 0 documents are skipped
* Merged #240 from [@TPXP](https://github.com/TPXP): Allow permission handling per index

1.5.7
======

* Merged #255 from [@Volodymyr-K](https://github.com/Volodymyr-K): Improve mongodb performance by using mongo aggregations
* Merged #209 from [@illmat](https://github.com/illmat): Have consistent snippets for custom suggestions
