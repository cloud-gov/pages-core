/*
 * Service for interfacing with GitHub
 */
var url = require('url');

var Client = require('github'),
    github = new Client({ version: '3.0.0' });

module.exports = {

  /*
   * Set a webhook on a repository
   * @param {Site} site model to apply the webhook
   * @param {Function} callback function
   */
  forkRepository: function(req, res) {
    Passport.findOne({ user: req.user.id }).exec(function(err, passport) {
      var templateId = req.body.templateId,
          repoUrl = url.parse(sails.config.templates[templateId].repo),
          repoOwner = repoUrl.pathname.split('/')[1],
          repoName = repoUrl.pathname.split('/')[2];

      // Authenticate request with user's oauth token
      github.authenticate({
        type: 'oauth',
        token: passport.tokens.accessToken
      });

      var data = {};
      data['user'] = repoOwner;
      data['repo'] = repoName

      github.repos.fork(data, function(err, suc) {
        if (err) { return res.status(400).send(err); }

        var values = {
          'owner': req.user.username,
          'repository': repoName,
          'defaultBranch': suc['default_branch'],
          'engine': 'jekyll',
          'user': req.user.id
        };

        Site.create(values).exec(function createCB(err, created) {
          if (err) { return res.status(400).send(err); }

          return res.json(created);
        });
      });
    });
  },
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
