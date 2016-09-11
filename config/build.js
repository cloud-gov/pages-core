/*
 * Settings the build process
 */
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var federalistCreds = appEnv.getServiceCreds('federalist-staging-env');
var p = federalistCreds || process.env;

module.exports.build = {
  tempDir: p.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: p.FEDERALIST_PUBLISH_DIR || './assets',
  engine: p.FEDERALIST_BUILD_ENGINE ||'buildengine',
  cacheControl: p.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: p.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status/',
  token: p.FEDERALIST_BUILD_TOKEN,
  awsBuildKey: p.FEDERALIST_AWS_BUILD_KEY,
  awsBuildSecret: p.FEDERALIST_AWS_BUILD_SECRET,
  s3Bucket: p.FEDERALIST_S3_BUCKET,
  sqsQueue: p.FEDERALIST_SQS_QUEUE,
  containerName: p.FEDERALIST_ECS_CONTAINER || 'builder'
};
