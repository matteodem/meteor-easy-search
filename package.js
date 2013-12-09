Package.describe({
    summary : "Easy to use search, with Elastic-Search"
});

Npm.depends({
  'elasticsearchclient': '0.5.3'
});

Package.on_use(function (api) {
    api.use(['underscore', 'livedata', 'mongo-livedata', 'meteor', 'standard-app-packages'], ['client', 'server']);

    api.add_files([
        'lib/easy-search-client.js'
    ], 'client');

    api.add_files([
        'lib/easy-search-server.js'
    ], 'server');

    api.export('EasySearch');
});
