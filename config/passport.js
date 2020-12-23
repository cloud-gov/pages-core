const env = require('../services/environment.js')();

const GithubClientID = env.GITHUB_CLIENT_ID || 'not_set';
const GithubClientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';

const GitlabClientID = env.GITHUB_CLIENT_ID || 'not_set';
const GitlabClientSecret = env.GITHUB_CLIENT_SECRET || 'not_set';

const url = path => `${env.APP_HOSTNAME}${path}`;

const ssoOptions = {
  authorizationURL: 'http://localhost:8080',
  tokenURL: 'http://localhost:8080',
  userURL: 'http://localhost:8080',
  logoutURL: 'http://localhost:8080',
};

module.exports = {
  github: {
    options: {
      GithubClientID,
      GithubClientSecret,
      callbackURL: url('/auth/github/callback'),
      scope: ['user', 'repo', 'write:repo_hook'],
      state: true,
    },
    externalOptions: {
      GithubClientID,
      GithubClientSecret,
      callbackURL: url('/external/auth/github/callback'),
      scope: ['user', 'repo'],
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
  gitlab: {
    options: {
      GitlabClientID,
      GitlabClientSecret,
      callbackURL: url('/auth/gitlab/callback'),
      scope: ['api'],
      state: true,
    },
    externalOptions: {
      GitlabClientID,
      GitlabClientSecret,
      callbackURL: url('/external/auth/github/callback'),
      scope: ['read_user'],
    },
    organizations: [
      14109682, // federalist-users
    ],
  },
  sso: {
    options: {
      ...ssoOptions,
      callbackURL: url('/auth/sso/callback'),
      logoutCallbackURL: url('/auth/sso/logout'),
    },
    adminOptions: {
      ...ssoOptions,
      callbackURL: url('/admin/auth/sso/callback'),
      logoutCallbackURL: url('/admin/auth/sso/logout'),
    },
  },
};
