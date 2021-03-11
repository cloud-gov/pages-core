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
      // Keep these options below in your local.js config
      // to connect the the docker-compose uaa service
      uaa: {
        options: {
          clientID: 'user-client',
          clientSecret: 'user-client-secret',
          tokenURL: 'http://uaa:8080/oauth/token',
          userURL: 'http://uaa:8080/userinfo',
        },
        adminOptions: {
          clientID: 'admin-client',
          clientSecret: 'admin-client-secret',
          tokenURL: 'http://uaa:8080/oauth/token',
          userURL: 'http://uaa:8080/userinfo',
        },
      },
    },
    s3: {},
    sqs: {},
  };
}
