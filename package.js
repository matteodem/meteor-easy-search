Package.describe({
    summary : "Easy-to-use search with Blaze Components (+ Elastic Search support)"
});

Npm.depends({
  'elasticsearch': '2.2.0'
});

Package.on_use(function (api) {
    api.use(['underscore', 'livedata', 'mongo-livedata', 'meteor',
        'standard-app-packages', 'less'], ['client', 'server']);

    api.use(['templating', 'ui', 'jquery'], 'client');

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
