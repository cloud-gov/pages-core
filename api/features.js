const getEnv = require('../services/environment');

const FLAGS = {};

const ENV_VAR_PREFIX = 'FEATURE_';

function toEnvVar(flag) {
  return `${ENV_VAR_PREFIX}${flag}`;
}

class UnknownFeatureFlagError extends Error {
  constructor(flag, ...args) {
    const flagsStr = Object.keys(FLAGS).join('\n');
    const msg = `Requested feature status for unknown feature flag ${flag}. Available flags are:\n${flagsStr}.`;
    super(msg, ...args);
  }
}

function enabled(flag) {
  if (!Object.keys(FLAGS).includes(flag)) {
    throw new UnknownFeatureFlagError(flag);
  }

  return [true, 'True', 'true', 'TRUE'].includes(getEnv()[toEnvVar(flag)]);
}

function disabled(flag) {
  return !enabled(flag);
}

module.exports = {
  disabled, enabled, FLAGS, UnknownFeatureFlagError,
};
