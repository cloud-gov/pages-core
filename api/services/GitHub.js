/*
 * Service for interfacing with GitHub
 */
var url = require('url'),
    Client = require('github'),
    github = new Client({ version: '3.0.0' });

module.exports = {

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
  validateUser: function(accessToken) {
    var approved = sails.config.passport.github.organizations || [];
    if (process.env.NODE_ENV === 'test' && process.env.FEDERALIST_TEST_ORG) {
      approved.push(parseInt(process.env.FEDERALIST_TEST_ORG));
    }

    // Authenticate request with user's oauth token
    github.authenticate({
      type: 'oauth',
      token: accessToken
    });

    return new Promise((resolve, reject) => {
      // Get user's organizations
      github.user.getOrgs({}, function(err, organizations) {
        if (err) return reject(new Error(err.message));

        // Do the user's organizations in any on the approved list?
        var hasApproval = _(organizations)
              .pluck('id')
              .intersection(approved)
              .value().length > 0;
        if (hasApproval) return resolve();
        reject(new Error('Unauthorized'));
      });
    })
  },

  /*
   * Check user permissions
   * @param {object} user model
   * @param {string} repository owner
   * @param {string} repository name
   * @param {Function} callback function
   */
   checkPermissions: function(user, owner, repository, done) {
     Passport.findOne({ user: user.id }).exec(function(err, passport) {
       if (err) return done(err);

       // Authenticate request with user's oauth token
       github.authenticate({
         type: 'oauth',
         token: passport.tokens.accessToken
       });

       // Retrieve the permissions for the repository
       github.repos.get({
         user: owner,
         repo: repository
       }, function(err, repo) {
         if (err) return done('Unable to access the repository');
         if (!repo) return done('The repository does not exist');
         return done(null, repo.permissions);
       });

     });
   }

};
