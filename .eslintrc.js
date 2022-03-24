const finalRules = {
  /* airbnb config overrides */
  'react/jsx-filename-extension': [0],
  'import/no-extraneous-dependencies': [0],
  'import/no-named-as-default': [0], // allow component to be the same as the default export
  'class-methods-use-this': [0],
  'no-throw-literal': [0],
  'comma-dangle': ['error',
    {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    },
  ],
  'arrow-parens': [2, 'as-needed', { requireForBlockBody: true }],

  // Allow prop spreading for React components, but not for html elements
  'react/jsx-props-no-spreading': [2, {
    custom: 'ignore',
    explicitSpread: 'ignore',
  }],

  'sonarjs/no-duplicate-string': [0],
  'sonarjs/no-identical-functions': [0],
};

module.exports = {
  extends: ['airbnb', 'plugin:sonarjs/recommended'],
  plugins: ['sonarjs'],
  rules: finalRules,
  parserOptions: {
    ecmaVersion: 2021,
  },
};
