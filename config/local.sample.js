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
    // build: {
    //   awsBuildKey: "123abc",
    //   awsBuildSecret: "123abc",
    //   s3Bucket: "bucket-name",
    //   awsRegion: "us-gov-west-1",
    //   sqsQueue: "https://sqs.us-east-1.amazonaws.com/123abc/456def",
    //   appName: "federalist-staging",
    //   appDomain: "fr.cloud.gov",
    // },
    // sqs: {
    //   accessKeyId: "123abc",
    //   secretAccessKey: "456def",
    //   region: "us-east-1",
    // },
    // S3: new AWS.S3({
    //   accessKeyId: "123abc",
    //   secretAccessKey: "456def",
    //   region: "us-gov-west-1",
    // }),
  }
}
