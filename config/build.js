/*
 * Settings the build process
 */
module.exports.build = {
  tempDir: process.env.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: process.env.FEDERALIST_PUBLISH_DIR || './assets',
  s3Bucket: process.env.FEDERALIST_S3_BUCKET
};
