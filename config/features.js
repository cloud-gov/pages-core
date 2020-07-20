const getEnv = require('../services/environment.js');

function getFeatureFlags() {
  const env = getEnv();
  return Object.keys(env)
    .filter(key => key.startsWith('FEATURE_'))
    .reduce((flags, key) => ({
      ...flags,
      [key.replace('FEATURE_', '')]: env[key],
    }), {});
}

module.exports = getFeatureFlags;
