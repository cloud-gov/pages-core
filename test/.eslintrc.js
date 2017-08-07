module.exports = {
  env: {
    mocha: true,
  },
  rules: {
    'no-unused-expressions': [0], // because chai's expect is weird

    /* ScanJS rule overrides from main .eslintrc */
    'scanjs-rules/assign_to_search': 0,
    'scanjs-rules/assign_to_hostname': 0,
  },
};
