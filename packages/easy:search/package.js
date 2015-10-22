Package.describe({
  name: 'easy:search',
  summary: "Easy-to-use search with Blaze Components (+ Elastic Search Support)",
  version: "2.0.0",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: "../../README.md"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');

  api.use(['easysearch:core@2.0.0', 'easysearch:components@2.0.0']);

  api.export('EasySearch');
});
