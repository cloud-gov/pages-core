/**
 * Passport configuration
 *
 * This is the configuration for your Passport.js setup and where you
 * define the authentication strategies you want your application to employ.
 *
 * I have tested the service with all of the providers listed below - if you
 * come across a provider that for some reason doesn't work, feel free to open
 * an issue on GitHub.
 *
 * Also, authentication scopes can be set through the `scope` property.
 *
 * For more information on the available providers, check out:
 * http://passportjs.org/guide/providers/
 */

var env = require('../services/environment.js')();

module.exports.passport = {
  local: {
    strategy: require('passport-local').Strategy
  },
  github: {
    name: 'GitHub',
    protocol: 'oauth2',
    strategy: require('passport-github').Strategy,
    options: {
      clientID: env.GITHUB_CLIENT_ID || 'not_set',
      clientSecret: env.GITHUB_CLIENT_SECRET || 'not_set',
      callbackURL: env.GITHUB_CLIENT_CALLBACK_URL || 'not_set',
      scope: ['user', 'repo']
    },
    // IDs for approved organizations
    // Includes the 18F organization by default
    organizations: [
      6233994,  // 18f
      14109682, // federalist-users
      14080592  // us-federal-sbst
    ]
  }a
};
