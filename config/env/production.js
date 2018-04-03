const env = require('../../services/environment')();
const cfenv = require('cfenv');

const appEnv = cfenv.getAppEnv();

// Database Config
const rdsCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-rds`);
if (rdsCreds) {
  module.exports.postgres = {
    database: rdsCreds.db_name,
    host: rdsCreds.host,
    user: rdsCreds.username,
    password: rdsCreds.password,
    port: rdsCreds.port,
  };
} else {
  throw new Error('No database credentials found.');
}

// S3 Configs
const s3Creds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-s3`);
if (s3Creds) {
  module.exports.s3 = {
    accessKeyId: s3Creds.access_key_id,
    secretAccessKey: s3Creds.secret_access_key,
    region: s3Creds.region,
    bucket: s3Creds.bucket,
  };
} else {
  // this env variable block to be removed once SQS user-provided service is created in production environment but will keep exception block
  let sqsKey = env.FEDERALIST_AWS_BUILD_KEY;
  let sqsSecret = env.FEDERALIST_AWS_BUILD_SECRET;
  let sqsQueue = env.FEDERALIST_SQS_QUEUE;
  let sqsRegion = env.FEDERALIST_SQS_REGION;

  if (sqsKey && sqsSecret && sqsQueue) {
    module.exports.sqs = {
      accessKeyId: sqsKey,
      secretAccessKey: sqsSecret,
      region: sqsRegion,
      queue: sqsQueue,
    };
  } else {
    throw new Error('No S3 credentials found');
  }
}

// SQS Configs
const sqsCredentials = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-sqs-creds`);
const sqsKey = sqsCredentials.access_key;
const sqsSecret = sqsCredentials.secret_key;
const sqsQueue = sqsCredentials.sqs_url;
const sqsRegion = sqsCredentials.region;
if (sqsKey && sqsSecret && sqsQueue) {
  module.exports.sqs = {
    accessKeyId: sqsKey,
    secretAccessKey: sqsSecret,
    region: sqsRegion,
    queue: sqsQueue,
  };
} else {
  throw new Error('No SQS credentials found');
}

// See https://github.com/nfriedly/express-rate-limit/blob/master/README.md#configuration
// for all express-rate-limit options available
module.exports.rateLimiting = {
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 50, // limit each IP to 50 requests per window
  delayAfter: 25, // delay requests by delayMs after 25 are made in a window
  delayMs: 500, // delay requests by 500 ms
};
