// Defaults for all environments
var env = require('./environment.js')();

module.exports.webhook = {
  endpoint: env.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: env.GITHUB_WEBHOOK_SECRET || 'testingSecret'
};
