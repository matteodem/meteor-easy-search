Package.describe({
  name: 'easysearch:elasticsearch',
  version: '2.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'elasticsearch': '5.0.0'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');

  // Dependencies
  api.use(['check']);
  api.use(['easysearch:core', 'grigio:babel', 'erasaur:meteor-lodash@3.10.0']);

  api.addFiles([
    'lib/data-syncer.jsx',
    'lib/engine.jsx'
  ]);

  api.export('EasySearch');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('easysearch:elasticsearch');

  // Test Helpers
  api.addFiles(['tests/engine-tests.js']);
});
