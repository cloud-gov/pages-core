import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import mochaPlugin from 'eslint-plugin-mocha';
import eslintConfigPrettier from 'eslint-config-prettier';
import testingLibrary from 'eslint-plugin-testing-library';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
// import sonarjsPlugin from 'eslint-plugin-sonarjs';

export default [
  {
    files: ['**/*.js'],
    ignores: ['frontend/**/*.{js,jsx}'],
    ...importPlugin.flatConfigs.recommended,
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
  {
    ignores: [
      'test/frontend/**/*.{js,jsx}',
      'public/*',
      '!**/.eslintrc.*',
      'migrations',
      'apps',
      'packages',
      'dist',
      'admin-client',
    ],
  },
  {
    ...mochaPlugin.configs.flat.recommended,
    rules: {
      'mocha/no-mocha-arrows': 'off',
    },
  },
  {
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['frontend/**/*.{js,jsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.mocha,
        global: false,
        process: false,
      },
    },
  },
  {
    files: ['test/**/*.{js,jsx}', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    ...testingLibrary.configs['flat/react'],
  },
  pluginReact.configs.flat['jsx-runtime'],
  pluginReact.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  pluginJs.configs.recommended,
  // ignore for a future PR to minimize noise
  // sonarjsPlugin.configs.recommended,
  eslintConfigPrettier,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'no-await-in-loop': 'error',
      'no-console': 'error',
      'no-param-reassign': 'error',
      'no-plusplus': 'error',
      // ignore for a future PR to minimize noise
      // 'max-len': ['error', { code: 80, ignoreUrls: true }],
    },
  },
];
