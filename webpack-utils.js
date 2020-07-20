function getFeatureFlags(env) {
  return Object.keys(env)
    .filter(key => key.startsWith('FEATURE_'))
    .reduce((flags, key) => ({
      ...flags,
      [key]: JSON.stringify(env[key]),
    }), {});
}

module.exports = {
  getFeatureFlags,
};
