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
  api.use(['check', 'templating', 'reactive-dict', 'random']);
  api.use(['stevezhu:lodash', 'grigio:babel', 'peerlibrary:blaze-components@0.13.0', 'easysearch:core@2.0.0']);

  // Base Component
  api.addFiles(['lib/base.jsx', 'lib/single-index.jsx', 'lib/component-methods.jsx', 'lib/core.jsx'], 'client');

  // Input and Each
  api.addFiles(['lib/input/input.html', 'lib/input/input.jsx'], 'client');
  api.addFiles(['lib/each/each.html', 'lib/each/each.jsx'], 'client');

  // If Components
  api.addFiles(['lib/if-input-empty/if-input-empty.html', 'lib/if-input-empty/if-input-empty.jsx'], 'client');
  api.addFiles(['lib/if-no-results/if-no-results.html', 'lib/if-no-results/if-no-results.jsx'], 'client');
  api.addFiles(['lib/if-searching/if-searching.html', 'lib/if-searching/if-searching.jsx'], 'client');

  // Loading More Components
  api.addFiles([
    'lib/load-more/load-more.html', 'lib/load-more/load-more.jsx', 'lib/pagination/pagination.html', 'lib/pagination/pagination.jsx'
  ], 'client');

  api.export('EasySearch');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('easysearch:components');

  // Test Helpers
  api.addFiles(['tests/helpers.js']);

  // Unit tests
  api.addFiles([
    'tests/unit/input-tests.js', 'tests/unit/each-tests.js', 'tests/unit/if-tests.js', 'tests/unit/base-tests.js',
    'tests/unit/load-more-tests.js', 'tests/unit/core-tests.js', 'tests/unit/pagination-tests.js'
  ], 'client');
});
