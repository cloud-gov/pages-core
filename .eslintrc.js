const finalRules = {
  /* airbnb config overrides */
  'react/jsx-filename-extension': [0],
  'import/no-extraneous-dependencies': [0],
  'import/no-named-as-default': [0], // allow component to be the same as the default export
  'class-methods-use-this': [0],
  'no-throw-literal': [0],
  'comma-dangle': [
    'error',
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
  'react/jsx-props-no-spreading': [
    2,
    {
      custom: 'ignore',
      explicitSpread: 'ignore',
    },
  ],
  'react/jsx-no-bind': [
    2,
    {
      allowArrowFunctions: true,
      allowFunctions: true,
    },
  ],
  'react/no-unstable-nested-components': [
    2,
    {
      allowAsProps: true,
    },
  ],
  'react/require-default-props': [0],
  'default-param-last': [0],
  'function-call-argument-newline': [0],
  'function-paren-newline': [0],
  'no-promise-executor-return': [0],
  'react/function-component-definition': [0],
  'sonarjs/no-duplicate-string': [0],
  'sonarjs/no-identical-functions': [0],
};

const overrides = [
  {
    files: ['frontend/**/*'],
    env: {
      browser: true,
      node: true,
    },
  },
];

module.exports = {
  overrides,
  plugins: ['import'],
  extends: [
    'airbnb',
    'plugin:sonarjs/recommended',
    'plugin:no-unsanitized/DOM',
  ],
  rules: finalRules,
  parserOptions: {
    ecmaVersion: 2021,
  },
  settings: {
    'import/resolver': {
      webpack: {}
    },
  },
};
