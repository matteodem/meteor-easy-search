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
  api.versionsFrom('1.1.0.3');

  // Dependencies
  api.use(['check']);
  api.use(['grigio:babel', 'erasaur:meteor-lodash@3.10.0']);

  // Core packages
  api.addFiles([
    'lib/core/index.jsx',
    'lib/core/engine.jsx',
    'lib/core/reactive-engine.jsx',
    'lib/core/cursor.jsx',
    'lib/core/search-collection.jsx'
  ]);

  // Engines
  api.addFiles([
    'lib/engines/mongo-db.jsx',
    'lib/engines/minimongo.jsx',
    'lib/engines/mongo-text-index.jsx'
  ]);

  // Global
  api.addFiles(['lib/globals.jsx']);

  api.export('EasySearch');
});

Package.onTest(function(api) {
  api.use('tinytest');
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
    'tests/functional/minimongo-tests.js'
  ]);
});
