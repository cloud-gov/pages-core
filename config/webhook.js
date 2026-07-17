const { validateEnvVar } = require('./envVarValidator');
// Defaults for all environments
const env = require('../services/environment')();

module.exports = {
  endpoint: env.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: validateEnvVar(env.GITHUB_WEBHOOK_SECRET, 'GITHUB_WEBHOOK_SECRET'),
  gitlabEndpoint: env.GITLAB_WEBHOOK_URL || 'https://pages-dev.cloud.gov/webhook/gitlab',
  gitlabSecret: validateEnvVar(env.GITLAB_WEBHOOK_SECRET, 'GITLAB_WEBHOOK_SECRET'),
};
