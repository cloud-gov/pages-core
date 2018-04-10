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
  throw new Error('No S3 credentials found');
}

// SQS Configs
const sqsCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-sqs-creds`);
if (sqsCreds) {
  module.exports.sqs = {
    accessKeyId: sqsCreds.access_key,
    secretAccessKey: sqsCreds.secret_key,
    region: sqsCreds.region,
    queue: sqsCreds.sqs_url,
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
