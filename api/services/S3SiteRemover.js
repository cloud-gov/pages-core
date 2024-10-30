const S3Helper = require('./S3Helper');

const CloudFoundryAPIClient = require('../utils/cfApiClient');

// handle error if service is not found and throw all other errors
const handleError = (err) => {
  try {
    if (!err.message.match(/Not found/)) {
      throw err;
    }
  } catch {
    throw err;
  }
};

const apiClient = new CloudFoundryAPIClient();

const removeInfrastructure = (site) =>
  apiClient
    .deleteRoute(site.awsBucketName)
    .catch(handleError) // if route does not exist continue to delete service instance
    .then(() => apiClient.deleteServiceInstance(site.s3ServiceName))
    .catch(handleError); // if service instance does not exist handle error & delete site

/**
  Deletes all of the objects in the S3 bucket belonging to the specified site.
*/
const removeSite = async (site) => {
  let credentials;
  try {
    try {
      credentials = await apiClient.fetchServiceInstanceCredentials(site.s3ServiceName);
    } catch (err) {
      if (!err.message.match(/Not found/)) {
        throw err;
      }
      const service = await apiClient.fetchServiceInstance(site.s3ServiceName);
      await apiClient.createServiceKey(site.s3ServiceName, service.metadata.guid);
      credentials = await apiClient.fetchServiceInstanceCredentials(site.s3ServiceName);
    }

    const s3Client = new S3Helper.S3Client({
      accessKeyId: credentials.access_key_id,
      secretAccessKey: credentials.secret_access_key,
      region: credentials.region,
      bucket: credentials.bucket,
    });

    // Added to wait until AWS credentials are usable in case we had to
    // provision new ones. This may take up to 10 seconds.
    await s3Client.waitForBucket();

    await s3Client.deleteAllBucketObjects();
  } catch (error) {
    handleError(error);
  }
};

module.exports = {
  removeInfrastructure,
  removeSite,
};
