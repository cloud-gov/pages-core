module.exports = {
  env: {
    mocha: true,
  },
  rules: {
    'no-unused-expressions': [0], // because chai's expect is weird
    'no-only-tests/no-only-tests': 'error',

    // Ok in tests
    'react/jsx-props-no-spreading': 0,
  },
  plugins: [
    'no-only-tests',
  ],
};
