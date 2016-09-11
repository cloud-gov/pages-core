// Defaults for all environments
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var federalistCreds = appEnv.getServiceCreds('federalist-staging-env');
var p = federalistCreds || process.env;

module.exports.webhook = {
  endpoint: p.GITHUB_WEBHOOK_URL || 'http://localhost:1337/webhook/github',
  secret: p.GITHUB_WEBHOOK_SECRET || 'testingSecret'
};
