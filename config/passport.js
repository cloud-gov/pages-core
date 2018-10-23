const env = require('../services/environment.js')();

module.exports = {
  github: {
    options: {
      clientID: env.GITHUB_CLIENT_ID || 'not_set',
      clientSecret: env.GITHUB_CLIENT_SECRET || 'not_set',
      callbackURL: env.GITHUB_CLIENT_CALLBACK_URL || 'not_set',
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    organizations: [
      6233994,  // 18f
      14109682, // federalist-users
    ],
  },
};
