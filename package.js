Package.describe({
  name: 'matteodem:easy-search',
  summary: "Easy-to-use search with Blaze Components (+ Elastic Search support)",
  version: "1.0.5",
  git: "https://github.com/matteodem/meteor-easy-search.git"
});

Npm.depends({
  'elasticsearch': '2.2.0'
});

Package.on_use(function (api) {
  if (api.versionsFrom) {
    api.use('underscore@1.0.0');
    api.use('livedata@1.0.0');
    api.use('mongo-livedata@1.0.0');
    api.use('meteor@1.0.0');
    api.use('standard-app-packages@1.0.0');
    api.use('less@1.0.0');

    api.use('templating@1.0.0', 'client');
    api.use('ui@1.0.0', 'client');
    api.use('jquery@1.0.0', 'client');
  } else {
    api.use(['underscore', 'livedata', 'mongo-livedata', 'meteor',
      'standard-app-packages', 'less'], ['client', 'server']);

    api.use(['templating', 'ui', 'jquery'], 'client');
  }

  api.add_files([
    'lib/easy-search-client.js',
    'lib/components/easy-search-components.html',
    'lib/components/easy-search-components.js',
    'lib/components/easy-search-components.less'
  ], 'client');

  api.add_files([
    'lib/easy-search-server.js'
  ], 'server');

  api.add_files('lib/easy-search-convenience.js');

  api.export('EasySearch');
});

Package.on_test(function (api) {
  if (api.versionsFrom) {
    api.use('matteodem:easy-search');
    api.use('tinytest@1.0.0');
  } else {
    api.use(['tinytest', 'easy-search']);
  }

  api.add_files(['tests/easy-search-tests.js']);
});
