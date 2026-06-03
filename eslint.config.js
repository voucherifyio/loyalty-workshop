import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.svelte-kit/**',
      'package/**',
      '*.config.js',
      'vite.config.js',
      'tailwind.config.js'
    ]
  },

  // JavaScript and module files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }]
    }
  },

  // Svelte files with plugin recommended config
  ...svelte.configs['flat/recommended'],

  // Svelte-specific configuration
  {
    files: ['**/*.svelte'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // Svelte-specific rules - warnings for potentially intentional patterns
      'svelte/no-at-html-tags': 'warn',
      'svelte/no-unused-svelte-ignore': 'warn',
      'svelte/no-useless-children-snippet': 'warn',
      
      // Compilation errors - keep as errors, but allow a11y warnings
      'svelte/valid-compile': ['error', {
        ignoreWarnings: true  // Ignore a11y warnings from Svelte compiler
      }],
      
      // Best practices - errors for common mistakes
      'svelte/require-each-key': 'error',
      'svelte/prefer-svelte-reactivity': 'warn', // Warn about Set/Map vs SvelteSet/SvelteMap
      'svelte/no-unnecessary-state-wrap': 'off', // Conflicting with other rules for SvelteSet/SvelteMap
      'svelte/prefer-writable-derived': 'warn', // Warn instead of error
      
      // Standard rules adjusted for Svelte
      'no-unused-vars': 'off',
      'no-undef': 'off', // Svelte compiler handles this
      'no-useless-assignment': 'warn'
    }
  },

  // Service and utility files - stricter rules
  {
    files: ['src/services/**/*.js', 'src/utils/**/*.js'],
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error'
    }
  },

  // Config files
  {
    files: ['src/config/**/*.js'],
    rules: {
      'no-magic-numbers': 'off'
    }
  }
];
