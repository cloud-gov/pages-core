// Defaults for all environments
const env = require('../services/environment')();

module.exports = {
  endpoint: env.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: env.GITHUB_WEBHOOK_SECRET || 'testingSecret',
};
