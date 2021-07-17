const githubOptions = {
  clientID: 'GITHUB_OAUTH_CLIENT_ID',
  clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
};

if (process.env.NODE_ENV !== 'test') {
  module.exports = {
    passport: {
      github: {
        options: githubOptions,
        authorizationOptions: githubOptions,
        externalOptions: githubOptions,
        organizations: [
          1234567, // YOUR GITHUB ORGANIZATION ID
        ],
      },
      // Keep these options below in your local.js config
      // to connect the the docker-compose uaa service
      uaa: {
        options: {
          clientID: 'pages-client',
          clientSecret: 'client-secret',
        },
      },
    },
    s3: {},
    sqs: {},
  };
}
