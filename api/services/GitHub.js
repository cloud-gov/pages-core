/*
 * Service for interfacing with GitHub
 */
var url = require('url'),
    Client = require('github'),
    github = new Client({ version: '3.0.0' });

module.exports = {

  /*
   * fork a repository template repository
   * @param {User} user model to own new template fork
   * @param {string} name of template to fork (from sails.config.templates)
   * @param {Function} callback function
   */
  forkRepository: function(user, templateId, done) {
    Passport.findOne({ user: user.id }).exec(function(err, passport) {
      var repoUrl = url.parse(sails.config.templates[templateId].repo),
          repoOwner = repoUrl.pathname.split('/')[1],
          repoName = repoUrl.pathname.split('/')[2],
          data = {
            user: repoOwner,
            repo: repoName
          };

      // Authenticate request with user's oauth token
      github.authenticate({
        type: 'oauth',
        token: passport.tokens.accessToken
      });

      github.repos.fork(data, function(err, suc) {
        if (err) return done(err);

        var values = {
          'owner': user.username,
          'repository': repoName,
          'defaultBranch': suc.default_branch,
          'engine': 'jekyll',
          'user': user.id
        };

        Site.create(values).exec(function createCB(err, created) {
          if (err) return done(err);
          return done(null, created);
        });
      });
    });
  },

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
