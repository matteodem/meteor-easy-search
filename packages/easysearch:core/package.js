Package.describe({
  name: 'easysearch:core',
  version: '2.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');

  // Dependencies
  api.use(['check', 'ecmascript', 'mongo']);
  api.use(['erasaur:meteor-lodash@3.10.0']);

  // Core packages
  api.addFiles([
    'lib/core/index.js',
    'lib/core/engine.js',
    'lib/core/reactive-engine.js',
    'lib/core/cursor.js',
    'lib/core/search-collection.js'
  ]);

  // Engines
  api.addFiles([
    'lib/engines/mongo-db.js',
    'lib/engines/minimongo.js',
    'lib/engines/mongo-text-index.js'
  ]);

  // Global
  api.addFiles(['lib/globals.js']);

  api.export('EasySearch');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'mongo', 'tracker', 'ecmascript']);
  api.use('easysearch:core');

  // Test Helpers
  api.addFiles(['tests/helpers.js']);

  // Unit tests
  api.addFiles([
    'tests/unit/core/cursor-tests.js',
    'tests/unit/core/engine-tests.js',
    'tests/unit/core/reactive-engine-tests.js',
    'tests/unit/core/index-tests.js'
  ]);

  // Functional tests
  api.addFiles([
    'tests/functional/mongo-db-tests.js',
    'tests/functional/mongo-text-index-tests.js',
    'tests/functional/minimongo-tests.js'
  ]);
});