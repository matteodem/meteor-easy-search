Package.describe({
  name: 'easysearch:elasticsearch',
  summary: "Elasticsearch Engine for Easy-Search",
  version: "2.0.0",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: 'README.md'
});

Npm.depends({
  'elasticsearch': '8.2.0'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');

  // Dependencies
  api.use(['check', 'ecmascript']);
  api.use(['easysearch:core', 'erasaur:meteor-lodash@3.10.0']);

  api.addFiles([
    'lib/data-syncer.js',
    'lib/engine.js'
  ]);

  api.export('EasySearch');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript']);
  api.use('easysearch:elasticsearch');

  api.addFiles(['tests/engine-tests.js']);
});
