function getFeatureFlags(env) {
  return Object.keys(env)
    .filter(key => key.startsWith('FEATURE_'));
}

module.exports = {
  getFeatureFlags,
};
