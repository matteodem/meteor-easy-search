Package.describe({
  name: 'easysearch:components',
  summary: "Blaze Components for EasySearch",
  version: "2.2.2",
  git: "https://github.com/matteodem/meteor-easy-search.git",
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2');

  // Dependencies
  api.use(['check', 'reactive-dict', 'ecmascript', 'random', 'underscore', 'tracker', 'mongo']);
  api.use(['peerlibrary:blaze-components@0.16.0', 'easysearch:core@2.2.2']);
  api.use(['erasaur:meteor-lodash@4.0.0'], { weak: true });

  // Base Component
  api.addFiles(['lib/base.js', 'lib/single-index.js', 'lib/component-methods.js', 'lib/core.js'], 'client');

  // Input and Each
  api.addFiles(['lib/input/input.html', 'lib/input/input.js', 'lib/field-input/field-input.html', 'lib/field-input/field-input.js'], 'client');
  api.addFiles(['lib/each/each.html', 'lib/each/each.js'], 'client');

  // If Components
  api.addFiles(['lib/if-input-empty/if-input-empty.html', 'lib/if-input-empty/if-input-empty.js'], 'client');
  api.addFiles(['lib/if-no-results/if-no-results.html', 'lib/if-no-results/if-no-results.js'], 'client');
  api.addFiles(['lib/if-searching/if-searching.html', 'lib/if-searching/if-searching.js'], 'client');

  // Loading More Components
  api.addFiles([
    'lib/load-more/load-more.html', 'lib/load-more/load-more.js', 'lib/pagination/pagination.html', 'lib/pagination/pagination.js'
  ], 'client');

  api.export('EasySearch');

  api.mainModule('lib/main.js');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript', 'tracker', 'underscore', 'mongo']);
  api.use('easysearch:components');

  // Test Helpers
  api.addFiles(['tests/helpers.js']);

  // Unit tests
  api.addFiles([
    'tests/unit/input-tests.js',
    'tests/unit/field-input-tests.js',
    'tests/unit/each-tests.js',
    'tests/unit/if-tests.js',
    'tests/unit/base-tests.js',
    'tests/unit/load-more-tests.js',
    'tests/unit/core-tests.js',
    'tests/unit/pagination-tests.js',
    'tests/unit/component-methods-tests.js'
  ], 'client');
});
