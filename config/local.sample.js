if (process.env.NODE_ENV !== 'test') {
  module.exports = {
    passport: {
      github: {
        options: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
        },
        externalOptions: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
        },
        organizations: [
          1234567, // YOUR GITHUB ORGANIZATION ID
        ],
      },
      uaa: {
        options: {
          clientID: 'UAA_OAUTH_CLIENT_ID',
          clientSecret: 'UAA_OAUTH_CLIENT_SECRET',
        },
      },
    },
    s3: {},
    sqs: {},
  };
}
