module.exports = {
  extends: [
    'airbnb',
    'plugin:security/recommended',
  ],
  plugins: ['security'],
  rules: {
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
  },
};
