import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintPluginSvelte from 'eslint-plugin-svelte';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: false,
      },
    },
  },
  { files: ['**/*.svelte'] },
  {
    ignores: ['public/build', 'rollup.config.js'],
  },
  pluginJs.configs.recommended,
  ...eslintPluginSvelte.configs['flat/recommended'],
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
