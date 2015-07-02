/*
 * Settings the build process
 */
module.exports.build = {
  sourceRoot: '/tmp/federalist',
  destinationRoot: 'assets/site',
  s3Bucket: process.env.S3_BUCKET
};
