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

module.exports.passport = {
  local: {
    strategy: require('passport-local').Strategy
  },

  // bearer: {
  //   strategy: require('passport-http-bearer').Strategy
  // },
  //
  // twitter: {
  //   name: 'Twitter',
  //   protocol: 'oauth',
  //   strategy: require('passport-twitter').Strategy,
  //   options: {
  //     consumerKey: 'your-consumer-key',
  //     consumerSecret: 'your-consumer-secret'
  //   }
  // },
  //
  github: {
    name: 'GitHub',
    protocol: 'oauth2',
    strategy: require('passport-github').Strategy,
    options: {
      clientID: process.env.GITHUB_CLIENT_ID || 'not_set',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'not_set',
      callbackURL: process.env.GITHUB_CLIENT_CALLBACK_URL || 'not_set',
      scope: ['user', 'repo']
    },
    // IDs for approved organizations
    // Includes the 18F organization by default
    organizations: [
      6233994,  // 18f
      14109682, // federalist-users
      14080592,  // us-federal-sbst
      6154722  // microsoft
    ]
  },
  //
  // facebook: {
  //   name: 'Facebook',
  //   protocol: 'oauth2',
  //   strategy: require('passport-facebook').Strategy,
  //   options: {
  //     clientID: 'your-client-id',
  //     clientSecret: 'your-client-secret',
  //     scope: ['email'] /* email is necessary for login behavior */
  //   }
  // },
  //
  // google: {
  //   name: 'Google',
  //   protocol: 'oauth2',
  //   strategy: require('passport-google-oauth').OAuth2Strategy,
  //   options: {
  //     clientID: 'your-client-id',
  //     clientSecret: 'your-client-secret'
  //   }
  // },
  //
  // cas: {
  //   name: 'CAS',
  //   protocol: 'cas',
  //   strategy: require('passport-cas').Strategy,
  //   options: {
  //     ssoBaseURL: 'http://your-cas-url',
  //     serverBaseURL: 'http://localhost:1337',
  //     serviceURL: 'http://localhost:1337/auth/cas/callback'
  //   }
  // }
};
