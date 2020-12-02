const env = require('../services/environment.js')();

const clientID = env.GITHUB_CLIENT_ID || 'not_set';
const clientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';

const url = path => `${env.APP_HOSTNAME}${path}`;

module.exports = {
  github: {
    options: {
      clientID,
      clientSecret,
      callbackURL: url('/auth/github/callback'),
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    externalOptions: {
      clientID,
      clientSecret,
      callbackURL: url('/external/auth/github/callback'),
      scope: ['user', 'repo'],
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
  uaa: {
    options: {
      authorizationURL: 'https://login.fr.cloud.gov/oauth/authorize',
      tokenURL: 'https://uaa.fr.cloud.gov/oauth/token',
      userURL: 'https://uaa.fr.cloud.gov/userinfo',
      logoutURL: 'https://uaa.fr.cloud.gov/logout.do',
      callbackURL: url('/admin/auth/uaa/callback'),
      logoutCallbackURL: url('/admin/auth/uaa/logout'),
    },
  },
};
