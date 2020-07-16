const env = require('../services/environment.js')();

module.exports = {
  github: {
    options: {
      clientID: process.env.GITHUB_CLIENT_ID || 'not_set',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'not_set',
      callbackURL: process.env.GITHUB_CLIENT_CALLBACK_URL || 'not_set',
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    externalOptions: {
      clientID: env.GITHUB_CLIENT_ID || 'not_set',
      clientSecret: env.GITHUB_CLIENT_SECRET || 'not_set',
      callbackURL: env.GITHUB_CLIENT_EXTERNAL_CALLBACK_URL || 'not_set',
      scope: ['user', 'repo'],
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
};
