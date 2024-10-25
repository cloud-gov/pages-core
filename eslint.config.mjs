import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import mochaPlugin from 'eslint-plugin-mocha';
import eslintConfigPrettier from 'eslint-config-prettier';
import testingLibrary from 'eslint-plugin-testing-library';

export default [
  {
    files: ['frontend/**/*.{js,jsx}', 'test/frontend/**/*.{js,jsx}'],
    ...pluginReact.configs.flat.recommended,
    ...pluginReact.configs.flat['jsx-runtime'],
    ...testingLibrary.configs['flat/react'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        global: false,
      },
    },
  },
  {
    files: ['**/*.js'],
    ignores: ['frontend/**/*.{js,jsx}', 'test/frontend/**/*.{js,jsx}'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
  pluginJs.configs.recommended,
  {
    ignores: [
      'test/frontend/support/**/*.js',
      'test/frontend/_mochaSetup.js',
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
  eslintConfigPrettier,
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
];
