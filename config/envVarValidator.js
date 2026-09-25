const cfenv = require('cfenv');
const getEnvironment = require('../services/environment');

function getRequiredEnvVars() {
  return [
    'UAA_CLIENT_ID',
    'UAA_CLIENT_SECRET',
    'FEDERALIST_SESSION_SECRET',
    'GITHUB_WEBHOOK_SECRET',
    ...(process.env.FEATURE_WORKSHOP_INTEGRATION === 'true'
      ? ['GITLAB_WEBHOOK_SECRET']
      : []),
  ];
}

const MIN_SECRET_LENGTH = 32;

function validateEnvVarPresent(envVarValue, envVarName) {
  if (getRequiredEnvVars().includes(envVarName) && !envVarValue) {
    throw new Error(
      `FATAL: ${envVarName} is required. ` +
        `Ensure the pages-${process.env.APP_ENV} service is bound correctly.`,
    );
  }
  return envVarValue;
}

function validateEnvVarSecret(envVarValue, envVarName) {
  validateEnvVarPresent(envVarValue, envVarName);

  if (
    getRequiredEnvVars().includes(envVarName) &&
    envVarValue.length < MIN_SECRET_LENGTH
  ) {
    throw new Error(`FATAL: ${envVarName} must be at least 32 characters.`);
  }

  return envVarValue;
}

function getUAACredentials(appEnv) {
  const uaaCredentials =
    appEnv.getServiceCreds(`app-${process.env.APP_ENV}-uaa-client`) || {};

  return {
    UAA_CLIENT_ID: uaaCredentials.clientID,
    UAA_CLIENT_SECRET: uaaCredentials.clientSecret,
  };
}

function getMissing(envVars) {
  return getRequiredEnvVars().filter((envVarName) => !envVars[envVarName]);
}

// For CI validate-env-vars task: only what is bound as services
function getMissingEnvVarsCi() {
  const appEnv = cfenv.getAppEnv();

  return getMissing({
    ...appEnv.getServiceCreds(`pages-${process.env.APP_ENV}-env`),
    ...getUAACredentials(appEnv),
  });
}

// For app startup (index.js): process.env + pages-<env>-env creds, with UAA creds
// from the service unless already set (e.g. by docker-compose locally)
function getMissingEnvVarsAtStartup() {
  return getMissing({
    ...getUAACredentials(cfenv.getAppEnv()),
    ...getEnvironment(),
  });
}

module.exports = {
  validateEnvVarSecret,
  validateEnvVarPresent,
  getRequiredEnvVars,
  getMissingEnvVarsCi,
  getMissingEnvVarsAtStartup,
};
