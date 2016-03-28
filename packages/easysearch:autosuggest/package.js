Package.describe({
  name: 'easysearch:autosuggest',
  summary: "Selectize Autosuggest Component for EasySearch",
  version: "2.0.9",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');

  // Dependencies
  api.use(['check', 'ecmascript', 'templating', 'blaze']);
  api.use(['easysearch:core@2.0.9', 'jeremy:selectize@0.12.1_4']);

  api.use(['erasaur:meteor-lodash@4.0.0'], { weak: true });

  api.addFiles([
    'lib/autosuggest.html',
    'lib/autosuggest.js'
  ], 'client');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript', 'templating']);
  api.use('easysearch:autosuggest');

  api.addFiles(['tests/autosuggest-tests.js'], 'client');
});
