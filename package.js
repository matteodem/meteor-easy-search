Package.describe({
  name: 'matteodem:easy-search',
  summary: "Easy-to-use search with Blaze Components (+ Elastic Search support)",
  version: "1.5.5",
  git: "https://github.com/matteodem/meteor-easy-search.git"
});

Npm.depends({
  'elasticsearch': '2.2.0'
});

Package.on_use(function (api) {
  if (api.versionsFrom) {
    api.versionsFrom('METEOR@1.0.4');
  }

  api.use(['underscore', 'livedata', 'mongo-livedata', 'meteor',
    'meteor-platform', 'less'], ['client', 'server']);

  api.use(['templating', 'ui', 'jquery'], 'client');

  api.add_files(['lib/easy-search-common.js', 'lib/easy-search-convenience.js']);

  api.add_files([
    'lib/searchers/mongo.js',
    'lib/easy-search-client.js',
    'lib/components/easy-search-components.html',
    'lib/components/easy-search-components.js',
    'lib/components/easy-search-components.less'
  ], 'client');

  api.add_files([
    'lib/searchers/mongo.js',
    'lib/easy-search-server.js',
    'lib/searchers/elastic-search.js'
  ], 'server');

  api.export('EasySearch');
});

Package.on_test(function (api) {
  if (api.versionsFrom) {
    api.use('matteodem:easy-search');
    api.use('tinytest@1.0.0');
  } else {
    api.use(['tinytest', 'easy-search']);
  }

  api.add_files(['tests/javascript-api-tests.js']);
  api.add_files(['tests/component-api-tests.js', 'tests/components-tests.js'], 'client');
});
