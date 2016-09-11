// Defaults for all environments
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var federalistCreds = appEnv.getServiceCreds('federalist-staging-env');
var process = federalistCreds || process.env;

module.exports.webhook = {
  endpoint: process.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: process.GITHUB_WEBHOOK_SECRET || 'testingSecret'
};
