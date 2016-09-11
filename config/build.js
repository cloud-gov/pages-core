/*
 * Settings the build process
 */

var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var federalistCreds = appEnv.getServiceCreds('federalist-staging-env');
var process = federalistCreds || process.env;

module.exports.build = {
  tempDir: process.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: process.FEDERALIST_PUBLISH_DIR || './assets',
  engine: process.FEDERALIST_BUILD_ENGINE ||'buildengine',
  cacheControl: process.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: process.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status/',
  token: process.FEDERALIST_BUILD_TOKEN,
  awsBuildKey: process.FEDERALIST_AWS_BUILD_KEY,
  awsBuildSecret: process.FEDERALIST_AWS_BUILD_SECRET,
  s3Bucket: process.FEDERALIST_S3_BUCKET,
  sqsQueue: process.FEDERALIST_SQS_QUEUE,
  containerName: process.FEDERALIST_ECS_CONTAINER || 'builder'
};
