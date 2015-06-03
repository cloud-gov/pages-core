/*
 * Service for interfacing with GitHub
 */
var Client = require('github'),
    github = new Client({ version: '3.0.0' });

module.exports = {

  /*
   * Set a webhook on a repository
   * @param {Site} site model to apply the webhook
   * @param {Function} callback function
   */
  setWebhook: function(site, done) {
    Passport.findOne({ user: site.user }).exec(function(err, passport) {
      if (err) return done(err);

      // Authenticate request with user's oauth token
      github.authenticate({
        type: 'oauth',
        token: passport.tokens.accessToken
      });

      // Create the webhook for the site repository
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

    });
  }
};
