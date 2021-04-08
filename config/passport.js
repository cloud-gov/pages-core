const env = require('../services/environment.js')();

const clientID = env.GITHUB_CLIENT_ID || 'not_set';
const clientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';

const url = path => `${env.APP_HOSTNAME}${path}`;

const uaaOptions = {
  authorizationURL: `${env.UAA_HOST}/oauth/authorize`,
  tokenURL: `${env.UAA_HOST}/oauth/token`,
  userURL: `${env.UAA_HOST}/userinfo`,
  logoutURL: `${env.UAA_HOST}/logout.do`,
};

module.exports = {
  github: {
    options: {
      clientID,
      clientSecret,
      callbackURL: url('/auth/github/callback'),
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    authorizationOptions: {
      clientID,
      clientSecret,
      callbackURL: url('/auth/github2/callback'),
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
    host: env.UAA_HOST,
    options: {
      ...uaaOptions,
      callbackURL: url('/auth/uaa/callback'),
      logoutCallbackURL: url('/auth/uaa/logout'),
    },
    adminOptions: {
      ...uaaOptions,
      callbackURL: url('/admin/auth/uaa/callback'),
      logoutCallbackURL: url('/admin/auth/uaa/logout'),
    },
  },
};
