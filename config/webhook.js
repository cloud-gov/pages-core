// Defaults for all environments

module.exports.webhook = {
  endpoint: process.env.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: process.env.GITHUB_WEBHOOK_SECRET || 'testingSecret'
};
