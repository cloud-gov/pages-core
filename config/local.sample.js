if (process.env.NODE_ENV !== 'test') {
  module.exports = {
    passport: {
      github: {
        options: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
          callbackURL: 'http://localhost:1337/auth/github/callback',
        },
        externalOptions: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
          callbackURL: 'http://localhost:1337/external/auth/github/callback',
        },
        adminOptions: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
          callbackURL: 'http://localhost:1337/admin/auth/github/callback',
        },
        organizations: [
          1234567, // YOUR GITHUB ORGANIZATION ID
        ],
      },
    },
    s3: {},
    sqs: {},
  };
}
