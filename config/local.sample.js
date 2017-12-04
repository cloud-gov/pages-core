if (process.env.NODE_ENV !== 'test') {
  module.exports = {
    passport: {
      github: {
        options: {
          clientID: 'GITHUB_OAUTH_CLIENT_ID',
          clientSecret: 'GITHUB_OAUTH_CLIENT_SECRET',
          callbackURL: 'http://localhost:1337/auth/github/callback',
        },
        organizations: [
          1234567, // YOUR GITHUB ORGANIZATION ID
        ],
      },
    },
    postgres: {
      database: 'federalist',
      host: 'db',
      user: 'postgres',
    },
    sqs: {
      accessKeyId: 'SQS_ACCESS_KEY',
      secretAccessKey: 'SQS_SECRET_KEY',
      region: 'us-gov-west-1',
      queue: 'SQS_URL',
    },
    s3: {
      accessKeyId: 'S3_ACCESS_KEY',
      secretAccessKey: 'S3_SECRET_KEY',
      region: 'us-gov-west-1',
      bucket: 'S3_BUCKET_NAME',
    },
  };
}
