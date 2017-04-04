if (process.env.NODE_ENV != "test") {
  module.exports = {
    passport: {
     github: {
       options: {
         clientID: '123abc',
         clientSecret: '456def',
         callbackURL: 'http://localhost:1337/auth/github/callback'
       },
       organizations: [
         1234567,
       ],
     },
    },
    postgres: {
      adapter: 'sails-postgresql',
      database: 'federalist',
    },
    sqs: {
      accessKeyId: "123abc",
      secretAccessKey: "456def",
      region: "us-gov-west-1",
      queue: "https://sqs.us-east-1.amazonaws.com/123abc/456def",
    },
    s3: {
      accessKeyId: "123abc",
      secretAccessKey: "456def",
      region: "us-gov-west-1",
      bucket: "cg-123-abc-456-def",
    },
  }
}

