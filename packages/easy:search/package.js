Package.describe({
  name: 'easy:search',
  summary: "Easy-to-use search with Blaze Components (+ Elastic Search Support)",
  version: "2.1.6",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: "../../README.md"
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2');

  api.use([
    'ecmascript',
    'easysearch:core@2.1.6',
    'easysearch:components@2.1.5',
  ]);

  api.export('EasySearch');

  api.mainModule('./main.js');
});
