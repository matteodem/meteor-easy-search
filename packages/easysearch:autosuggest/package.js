Package.describe({
  name: 'easysearch:autosuggest',
  version: '2.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');

  // Dependencies
  api.use(['check', 'ecmascript', 'templating', 'blaze']);
  api.use(['easysearch:core', 'jeremy:selectize', 'erasaur:meteor-lodash@3.10.0']);

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
