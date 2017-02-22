module.exports = {
  session: {
    cookie: {
      secure: false,
    },
  },
  build: {
    token: "123abc",
  },
  sqs: {
    accessKeyId: "123abc",
    secretAccessKey: "456def",
    region: 'us-east-1',
    queue: "https://sqs.us-east-1.amazonaws.com/123abc/456def",
  },
  s3: {
    accessKeyId: "123abc",
    secretAccessKey: "456def",
    region: "us-gov-west-1",
    bucket: "s3-bucket",
  },
  passport: {
   github: {
     options: {
       clientID: "123abc",
       clientSecret: "456def",
       callbackURL: "http://localhost:1337/auth/github/callback",
       scope: ["user", "repo"],
     },
     organizations: [
       123456,
     ],
    },
  },
  postgres: {
    adapter: 'sails-postgresql',
    database: process.env.TRAVIS ? "travis_ci_test" : "federalist-test",
  },
  log: {
    level: "error",
  },
}
