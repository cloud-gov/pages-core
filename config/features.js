const getEnv = require('../services/environment');

function getFeatureFlags() {
  const env = getEnv();
  return Object.keys(env)
    .filter(key => key.startsWith('FEATURE_'))
    .reduce((flags, key) => ({
      ...flags,
      [key]: env[key],
    }), {});
}

module.exports = getFeatureFlags;
