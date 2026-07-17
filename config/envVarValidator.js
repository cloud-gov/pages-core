function getRequiredEnvVars() {
  return [
    'FEDERALIST_SESSION_SECRET',
    'GITHUB_WEBHOOK_SECRET',
    ...(process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
      ? ['GITLAB_WEBHOOK_SECRET']
      : []),
  ];
}

function validateEnvVar(envVarValue, envVarName) {
  const requiredEnvVars = getRequiredEnvVars();

  if (requiredEnvVars.includes(envVarName)) {
    if (!envVarValue) {
      throw new Error(
        `FATAL: ${envVarName} is required. ` +
          `Ensure the pages-${process.env.APP_ENV} service is bound correctly.`,
      );
    }

    if (envVarValue.length < 32) {
      throw new Error(`FATAL: ${envVarName} must be at least 32 characters.`);
    }
  }

  return envVarValue;
}

module.exports = {
  validateEnvVar,
  getRequiredEnvVars,
  requiredEnvVarsCi: getRequiredEnvVars(),
  requiredEnvVarsNode: getRequiredEnvVars(),
};
