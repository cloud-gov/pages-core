const env = require("../../services/environment")()
const cfenv = require("cfenv")

const appEnv = cfenv.getAppEnv()

// Session Config
const redisCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-redis`)
if (redisCreds) {
  module.exports.session = {
    cookie: {
      secure: true,
    },
  }
  module.exports.redis = {
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
  module.exports.postgres: {
    adapter: 'sails-postgresql',
    database: rdsCreds.db_name,
    host: rdsCreds.host,
    user: rdsCreds.username,
    password: rdsCreds.password,
    port: rdsCreds.port,
  }
} else {
  throw new Error("No database credentials found.")
}

// S3 Configs
const s3Creds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-s3`)
if (s3Creds) {
  module.exports.s3 = {
    accessKeyId: s3Creds.access_key_id,
    secretAccessKey: s3Creds.secret_access_key,
    region: s3Creds.region,
    bucket: s3Creds.bucket,
  }
} else {
  throw new Error("No S3 credentials found")
}

// SQS Configs
const sqsKey = env.FEDERALIST_AWS_BUILD_KEY
const sqsSecret = env.FEDERALIST_AWS_BUILD_SECRET
const sqsQueue = env.FEDERALIST_SQS_QUEUE
const sqsRegion = env.FEDERALIST_SQS_REGION
if (sqsKey && sqsSecret && sqsQueue) {
  module.exports.sqs = {
    accessKeyId: sqsKey,
    secretAccessKey: sqsSecret,
    region: sqsRegion,
    queue: sqsQueue,
  }
} else {
  throw new Error("Now SQS credentials found")
}
