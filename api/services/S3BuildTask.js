const S3Helper = require('./S3Helper');
const CloudFoundryAPIClient = require('../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

const handleInvalidAccessKeyError = (error) => {
  const validS3KeyUpdateEnv =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (error.code === 'InvalidAccessKeyId' && validS3KeyUpdateEnv) {
    const message = 'S3 keys out of date. Update them with `npm run update-local-config`';
    throw {
      message,
      status: 400,
    };
  }

  throw error;
};

async function getObject(site, key) {
  return apiClient
    .fetchServiceInstanceCredentials(site.s3ServiceName)
    .then((credentials) => {
      const s3Client = new S3Helper.S3Client({
        accessKeyId: credentials.access_key_id,
        secretAccessKey: credentials.secret_access_key,
        region: credentials.region,
        bucket: credentials.bucket,
      });

      return s3Client.getObject(key).catch(handleInvalidAccessKeyError);
    });
}

module.exports = {
  getObject,
};
