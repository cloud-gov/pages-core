var AWS = require('aws-sdk')

module.exports = {
  build: {
    token: "123abc",
    awsBuildKey: "123abc",
    awsBuildSecret: "456def",
    s3Bucket: "s3-bucket",
    awsRegion: "us-gov-west-1",
    sqsQueue: "https://sqs.us-east-1.amazonaws.com/123abc/456def"
  },
  sqs: {
    accessKeyId: "123abc",
    secretAccessKey: "456def",
    region: 'us-east-1'
  },
  S3: new AWS.S3({
    accessKeyId: "123abc",
    secretAccessKey: "456def",
    region: "us-gov-west-1"
  }),
  passport: {
   github: {
     options: {
       clientID: "123abc",
       clientSecret: "456def",
       callbackURL: "http://localhost:1337/auth/github/callback",
       scope: ["user", "repo"]
     },
     organizations: [
       123456
     ]
    }
  }
}
