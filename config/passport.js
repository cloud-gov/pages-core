const env = require('../services/environment')();

const clientID = env.GITHUB_CLIENT_ID || 'not_set';
const clientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';

const gitLabClientID = '2bb0ad290c8dad08443c774e0f5f7c9293e6c2760b8e9f96e4b38a6dc16d4cd7';
const gitLabClientSecret =
  'gloas-9064da29d27635abef0bf4829d2fd45b8ee5273d41137a39a4df1fb49cbabcc8';

const url = (path) => `${env.APP_HOSTNAME}${path}`;

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
  gitlab: {
    authorizationOptions: {
      clientID: gitLabClientID,
      // clientID: "lsJF'JEFG'",
      clientSecret: gitLabClientSecret,
      // callbackURL: "http://gitlab.local.com:1337/auth/gitlab/callback",
      callbackURL: 'http://localhost:1337/auth/gitlab/callback',
      // callbackURL: "http://127.0.0.1:1337/auth/gitlab/callback",
      baseURL: 'http://gitlab.local.com:8929', // // Change "http://gitlab.com" if using self-hosted GitLab
      // baseURL: "http://localhost:8929", // // Change "http://gitlab.com" if using self-hosted GitLab - does not call callback
      // baseURL: "http://127.0.0.1:8929", // // Change "http://gitlab.com" if using self-hosted GitLab
      // tokenURL: 'http://gitlab.local.com:8929/oauth/token',
      // tokenURL: 'http://localhost:8929/oauth/token',
      // tokenURL: 'http://127.0.0.1:8929/oauth/token',
      // tokenURL: 'http://gitlab:8929/oauth/token',
      // authorizationURL: 'http://gitlab:8929/oauth/authorize'
      scope: ['read_repository api'],
      state: true, // false - disable state verification enirely
      responseType: 'code',
      // passReqToCallback: true,
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
  uaa: {
    options: {
      authorizationURL: `${env.UAA_HOST}/oauth/authorize`,
      tokenURL: `${env.UAA_HOST_DOCKER_URL || env.UAA_HOST}/oauth/token`,
      userURL: `${env.UAA_HOST_DOCKER_URL || env.UAA_HOST}/userinfo`,
      logoutURL: `${env.UAA_HOST}/logout.do`,
      scope: ['openid', 'scim.invite'],
    },
  },
};
