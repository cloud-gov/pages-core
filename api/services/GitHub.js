var Client = require('github'),
    github = new Client({
      version: '3.0.0'
    });

module.exports = {

  setWebhook: function(site, done) {
    authenticate();
    github.repos.createHook({
      user: site.owner,
      repo: site.repository,
      name: 'web',
      active: true,
      config: {
        url: sails.config.webhook.endpoint,
        secret: sails.config.webhook.secret,
        content_type: 'json'
      }
    }, done);
  }
};

function authenticate() {
  github.authenticate({
    type: 'oauth',
    token: sails.config.gitHubToken
  });
}
