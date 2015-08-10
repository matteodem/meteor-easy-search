Package.describe({
  name: 'easysearch:components',
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
  api.versionsFrom('1.1.0.3');

  // Dependencies
  api.use(['check', 'underscore', 'templating', 'reactive-dict']);
  api.use(['grigio:babel', 'peerlibrary:blaze-components@0.13.0', 'easysearch:core@2.0.0']);

  // Base Component
  api.addFiles(['lib/base.jsx', 'lib/component-registry.jsx']);

  // Input and Each
  api.addFiles(['lib/input/input.html', 'lib/input/input.jsx'], 'client');
  api.addFiles(['lib/each/each.html', 'lib/each/each.jsx'], 'client');

  // If Components
  api.addFiles(['lib/if-input-empty/if-input-empty.html', 'lib/if-input-empty/if-input-empty.jsx'], 'client');
  api.addFiles(['lib/if-no-results/if-no-results.html', 'lib/if-no-results/if-no-results.jsx'], 'client');
  api.addFiles(['lib/if-searching/if-searching.html', 'lib/if-searching/if-searching.jsx'], 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('easysearch:components');
});
