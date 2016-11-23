var AWS = require('aws-sdk')

if (process.env.NODE_ENV != "test") {
  module.exports = {
    // passport: {
    //  github: {
    //    options: {
    //      clientID: '123abc',
    //      clientSecret: '456def',
    //      callbackURL: 'http://localhost:1337/auth/github/callback'
    //    },
    //    organizations: [
    //      << get id from https://api.github.com/orgs/<your-org-name> >>
    //    ],
    //  },
    // },
    // connections: {
    //  postgres: {
    //    adapter: 'sails-postgresql',
    //    database: 'federalist',
    //  },
    // },
    // models: {
    //  connection: 'postgres',
    // },
    // sqs: {
    //   accessKeyId: "123abc",
    //   secretAccessKey: "456def",
    //   region: "us-east-1",
    //   queue: "https://sqs.us-east-1.amazonaws.com/123abc/456def",
    // },
    // s3: {
    //   accessKeyId: "123abc",
    //   secretAccessKey: "456def",
    //   region: "us-gov-west-1",
    //   bucket: "s3-bucket-name",
    // },
  }
}
