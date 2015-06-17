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
    var template = sails.config.templates[templateId];

    if (!template) return done(new Error('Invalid template ID'));

    Passport.findOne({ user: user.id }).exec(function(err, passport) {
      var repoUrl = url.parse(template.repo),
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
          'users': [user.id]
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
  setWebhook: function(site, user, done) {
    Passport.findOne({ user: user }).exec(function(err, passport) {
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
  },

  /*
   * Validate that a user is part of an approved Organization
   * @param {object} values to become a user model
   * @param {Function} callback function
   */
  validateUser: function(accessToken, done) {
    var approved = sails.config.passport.github.organizations || [];

    // Authenticate request with user's oauth token
    github.authenticate({
      type: 'oauth',
      token: accessToken
    });

    // Get user's organizations
    github.user.getOrgs({}, function(err, organizations) {
      if (err) return done(new Error(JSON.parse(err.message)));

      // Do the user's organizations in any on the approved list?
      var hasApproval = _(organizations)
            .pluck('id')
            .intersection(approved)
            .value().length > 0;
      if (hasApproval) return done();
      done(new Error('Unauthorized'));
    });
  }

};
