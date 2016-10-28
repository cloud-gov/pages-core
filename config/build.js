/*
 * Settings the build process
 */
var envFn = require('../services/environment.js');
var env = envFn();
var s3Creds = envFn(`federalist-${process.env.NODE_ENV}-s3`) || {};

module.exports.build = {
  tempDir: env.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: env.FEDERALIST_PUBLISH_DIR || './assets',
  engine: env.FEDERALIST_BUILD_ENGINE ||'buildengine',
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: env.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status/',
  token: env.FEDERALIST_BUILD_TOKEN,

  // s3 creds
  awsBuildKey: s3Creds.access_key_id || env.FEDERALIST_AWS_BUILD_KEY, // this name needs to change
  awsBuildSecret: s3Creds.secret_access_key || env.FEDERALIST_AWS_BUILD_SECRET, // change this
  s3Bucket: s3Creds.bucket || env.FEDERALIST_S3_BUCKET,
  awsRegion: s3Creds.region || env.FEDERALIST_S3_REGION || 'us-gov-west-1',

  sqsQueue: env.FEDERALIST_SQS_QUEUE,

  appName: env.APP_NAME || 'federalist-staging',
  appDomain: env.APP_DOMAIN || 'fr.cloud.gov'
};
