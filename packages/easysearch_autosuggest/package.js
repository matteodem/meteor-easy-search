Package.describe({
  name: 'easysearch:autosuggest',
  summary: "Selectize Autosuggest Component for EasySearch",
  version: "2.2.3",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2');

  // Dependencies
  api.use(['check', 'ecmascript', 'templating@1.2.15', 'blaze@2.2.0']);
  api.use([
    'easysearch:core@2.2.3',
    'easysearch:components@2.2.3',
    'jeremy:selectize@0.12.1_4',
  ]);

  api.use(['erasaur:meteor-lodash@4.0.0']);

  api.addFiles([
    'lib/autosuggest.html',
  ], 'client');

  api.mainModule('lib/autosuggest.js', 'client');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript', 'templating']);
  api.use('easysearch:autosuggest');

  api.addFiles(['tests/autosuggest-tests.js'], 'client');
});
