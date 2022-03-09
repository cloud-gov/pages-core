module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  rules: {
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
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
