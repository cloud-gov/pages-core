const env = require('../services/environment.js')();

const clientID = env.GITHUB_CLIENT_ID || 'not_set';
const clientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';
const callBackURL = (prefix = '') => `${env.APP_HOSTNAME}${prefix}/auth/github/callback`;

module.exports = {
  github: {
    options: {
      clientID,
      clientSecret,
      callbackURL: callBackURL(),
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    externalOptions: {
      clientID,
      clientSecret,
      callbackURL: callBackURL('/external'),
      scope: ['user', 'repo'],
    },
    adminOptions: {
      clientID,
      clientSecret,
      callbackURL: callBackURL('/admin'),
      scope: ['user', 'repo', 'read:org'],
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
};
