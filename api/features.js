const getEnv = require('../config/features');

const Flags = {
  /*
    All feature flags must be explicitly added here so they can be exported
    and referred to as Flags.<FEATURE_NAME>
    Ex.
    FEATURE_AWESOME_FEATURE: 'FEATURE_AWESOME_FEATURE',
    */
  FEATURE_FILE_STORAGE_SERVICE: 'FEATURE_FILE_STORAGE_SERVICE',
};

const TRUTHY_VALUES = [true, 'True', 'true', 'TRUE'];

function readEnv(envVar) {
  return getEnv()[envVar];
}

class UnknownFeatureFlagError extends Error {
  constructor(flag, ...args) {
    const flagsStr = Object.keys(Flags)
      .map((f) => `\n- ${f}`)
      .join('');
    // eslint-disable-next-line max-len
    const msg = `Requested feature status for unknown feature flag '${flag}'. Available flags are:${flagsStr}`;
    super(msg, ...args);
  }
}

function enabled(flag) {
  if (!Object.keys(Flags).includes(flag)) {
    throw new UnknownFeatureFlagError(flag);
  }

  return TRUTHY_VALUES.includes(readEnv(flag));
}

module.exports = {
  enabled,
  Flags,
  UnknownFeatureFlagError,
};
