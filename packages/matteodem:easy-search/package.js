Package.describe({
  name: 'matteodem:easy-search',
  summary: "Easy-to-use search with Blaze Components (+ Elastic Search support)",
  version: "2.0.0",
  git: "https://github.com/matteodem/meteor-easy-search.git"
});

Package.on_use(function (api) {
  if (api.versionsFrom) {
    api.versionsFrom('METEOR@1.0.4');
  }

  api.use('easy:search');
  api.export('EasySearch');

  console.log('matteodem:easy-search is deprecated (use easy:search instead)');
});
