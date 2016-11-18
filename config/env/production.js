const AWS = require('aws-sdk')
const env = require("../../services/environment")()
const cfenv = require("cfenv")

const appEnv = cfenv.getAppEnv()

// Grunt config
module.exports = {
  grunt: {
    _hookTimeout: 60 * 1000,
  }
}

// Session Config
const redisCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-redis`)
if (redisCreds) {
  module.exports.session = {
    cookie: {
      secure: true,
    },
    proxy: true,
    secret: env.FEDERALIST_SESSION_SECRET,
    adapter: 'connect-redis',
    host: redisCreds.hostname,
    port: redisCreds.port,
    db: 0,
    pass: redisCreds.password,
  }
} else {
  throw new Error("No redis credentials found.")
}

// Database Config
const rdsCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-rds`)
if (rdsCreds) {
  module.exports.connections = {
    postgres: {
      adapter: 'sails-postgresql',
      database: rdsCreds.db_name,
      host: rdsCreds.host,
      user: rdsCreds.username,
      password: rdsCreds.password,
      port: rdsCreds.port,
    }
  }
  module.exports.models = {
    connection: 'postgres',
  }
} else {
  throw new Error("No database credentials found.")
}

// S3 Configs
const s3Creds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-s3`)
if (s3Creds) {
  module.exports.S3 = new AWS.S3({
    accessKeyId: s3Creds.access_key_id,
    secretAccessKey: s3Creds.secret_access_key,
    region: s3Creds.region,
  })
} else {
  throw new Error("No S3 credentials found")
}

// SQS Configs
const sqsKey = env.FEDERALIST_AWS_BUILD_KEY
const sqsSecret = env.FEDERALIST_AWS_BUILD_SECRET
if (sqsKey && sqsSecret) {
  module.exports.sqs = {
    accessKeyId: sqsKey,
    secretAccessKey: sqsSecret,
    region: 'us-east-1',
  }
} else {
  throw new Error("Now SQS credentials found")
}
