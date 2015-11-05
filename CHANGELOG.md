2.0.3
=====

* Fixed #330: Allow custom index names to allow multiple indexes for one MongoDB collection
* Merged #346 from [@rjsmith](https://github.com/rjsmith): Downgrade lodash as a weak dependency for core and components, use underscore instead
* Fixed #322: Meteor error when using ElasticSearch engine

2.0.2
=====

* Fixed #328: Check arguments in search publication
* Fixed #343: Inherit getFindOptions in text index engine
* Fixed #332: Add search options to docs
* Fixed #331: Upgrade blaze components dependency to 0.15.1

2.0.1
=====

* Add userId to search options on server side for consistency (since Meteor.userId() does not work in publications)

2.0.0
=====

* Contains lots of bugfixes, features and general refactoring see [UPGRADE-2.0.md](UPGRADE-2.0.md) and docs

1.6.4
=====

* Remove less dependency by using plain css for styles

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
