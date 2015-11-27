/*
 * Settings the build process
 */
module.exports.build = {
  tempDir: process.env.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: process.env.FEDERALIST_PUBLISH_DIR || './assets',
  engine: process.env.FEDERALIST_BUILD_ENGINE ||'buildengine',
  cacheControl: process.env.FEDERALIST_CACHE_CONTROL || 'max-age=60',
  callback: process.env.FEDERALIST_BUILD_CALLBACK || 'http://localhost:1337/build/status',
  token: process.env.FEDERALIST_BUILD_TOKEN,
  awsBuildKey: process.env.FEDERALIST_AWS_BUILD_KEY,
  awsBuildSecret: process.env.FEDERALIST_AWS_BUILD_SECRET,
  s3Bucket: process.env.FEDERALIST_S3_BUCKET,
  sqsQueue: process.env.FEDERALIST_SQS_QUEUE,
  containerName: process.env.FEDERALIST_ECS_CONTAINER
};
