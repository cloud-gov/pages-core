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
};

const finalPlugins = [];

let scanjsRulesConfig = null;

try {
  // eslint-disable-next-line global-require
  const scanjsConfig = require('eslint-plugin-scanjs-rules');
  scanjsRulesConfig = {};

  // ScanJS rules we don't want to use:
  const ignoredScanjsRules = [
    // scanjs is looking for a different `connect` than the one we use often from react-redux
    'call_connect',
  ];

  // bring in all the scanjs rules (other than those we want ignored),
  // prefixed with 'scanjs-rules',
  // but convert them to eslint errors instead of warnings
  Object.keys(scanjsConfig.rulesConfig)
    .filter(rule => ignoredScanjsRules.indexOf(rule) === -1)
    .forEach((rule) => {
      scanjsRulesConfig[`scanjs-rules/${rule}`] = 1;
    });
} catch (err) {
  // eslint-disable-next-line no-console
  console.log('eslint-plugin-scanjs-rules not found, will not include scanjs rules');
}

if (scanjsRulesConfig) {
  finalPlugins.push('scanjs-rules', 'no-unsanitized');

  const noUnsanitizedRules = {
    'no-unsanitized/method': 2,
    'no-unsanitized/property': 2,
  };

  Object.assign(finalRules, scanjsRulesConfig, noUnsanitizedRules);
}

module.exports = {
  extends: 'airbnb',
  plugins: finalPlugins,
  rules: finalRules,
  parserOptions: {
    ecmaVersion: 9,
  },
};
