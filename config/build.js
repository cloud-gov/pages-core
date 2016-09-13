/*
 * Settings the build process
 */
var env = require('../services/environment.js')();

module.exports.build = {
  tempDir: env.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: env.FEDERALIST_PUBLISH_DIR || './assets',
  engine: env.FEDERALIST_BUILD_ENGINE ||'buildengine',
  cacheControl: env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: env.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status/',
  token: env.FEDERALIST_BUILD_TOKEN,
  awsBuildKey: env.FEDERALIST_AWS_BUILD_KEY,
  awsBuildSecret: env.FEDERALIST_AWS_BUILD_SECRET,
  s3Bucket: env.FEDERALIST_S3_BUCKET,
  sqsQueue: env.FEDERALIST_SQS_QUEUE,
  containerName: env.FEDERALIST_ECS_CONTAINER || 'builder'
};
