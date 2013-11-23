Package.describe({
    summary : "Easy to use search"
});

Package.on_use(function (api) {
    api.use('underscore');

    api.add_files([
        'lib/easy-search.js'
    ], 'client'
    );

    api.export('EasySearch');
});
