module.exports = {
  env: {
    mocha: true,
  },
  rules: {
    'no-unused-expressions': [0], // because chai's expect is weird
  },
};
