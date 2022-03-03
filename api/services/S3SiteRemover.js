const S3Helper = require('./S3Helper');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const config = require('../../config');

// handle error if service is not found an throw all other errors
const handleError = (err) => {
  try {
    if (!err.message.match(/Not found/)) {
      throw err;
    }
  } catch (e) {
    throw err;
  }
};

const apiClient = new CloudFoundryAPIClient();

function usesDedicatedBucket(site, s3) {
  return site.s3ServiceName !== s3.serviceName && site.awsBucketName !== s3.bucket;
}

/**
  Deletes the array of S3 objects passed to it.
  Since AWS limits the number of objects that can be deleted at a time, this
  method deletes the objects 1000 at a time. It does so recursively so each
  group of 1000 is deleted one after the other instead of simultaneously. This
  prevents the delete requests from breaking AWS's rate limit.
*/
const deleteObjects = (s3Client, keys) => {
  if (!keys.length) {
    return Promise.resolve();
  }

  const keysToDeleteNow = keys.slice(0, S3Helper.S3_DEFAULT_MAX_KEYS);
  const keysToDeleteLater = keys.slice(S3Helper.S3_DEFAULT_MAX_KEYS, keys.length);

  return new Promise((resolve, reject) => {
    s3Client.client.deleteObjects({
      Bucket: s3Client.bucket,
      Delete: {
        Objects: keysToDeleteNow.map(object => ({ Key: object })),
      },
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(() => deleteObjects(s3Client, keysToDeleteLater));
};

const deleteRobots = s3Client => new Promise((resolve, reject) => {
  s3Client.client.deleteObjects({
    Bucket: s3Client.bucket,
    Delete: {
      Objects: [{ Key: 'robots.txt' }],
    },
  }, (err, data) => {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  });
});

const getKeys = (s3Client, prefix) => s3Client.listObjects(prefix)
  .then(objects => objects.map(o => o.Key));

const removeInfrastructure = (site) => {
  if (usesDedicatedBucket(site, config.s3)) {
    return apiClient.deleteRoute(site.awsBucketName)
      .catch(handleError) // if route does not exist continue to delete service instance
      .then(() => apiClient.deleteServiceInstance(site.s3ServiceName))
      .catch(handleError); // if service instance does not exist handle error & delete site
  }

  return Promise.resolve();
};

const removeSite = async (site) => {
  const prefixes = [
    `site/${site.owner}/${site.repository}`,
    `demo/${site.owner}/${site.repository}`,
    `preview/${site.owner}/${site.repository}`,
  ];

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
    await s3Client.waitForCredentials();

    const keys = await Promise.all(
      prefixes.map(prefix => getKeys(s3Client, `${prefix}/`))
    );

    let mergedKeys = [].concat(...keys);

    if (mergedKeys.length) {
      /**
       * The federalist build container puts redirect objects in the root of each user's folder
       * which correspond to the name of each site prefix. Because each site prefix is suffixed
       * with a trailing `/`, `listObjects will no longer see them.
       * Therefore, they are manually added to the array of keys marked for deletion.
       */
      mergedKeys = mergedKeys.concat(prefixes.slice(0));
    }

    await deleteObjects(s3Client, mergedKeys);

    if (usesDedicatedBucket(site, config.s3)) {
      await deleteRobots(s3Client);
    }
  } catch (error) {
    handleError(error);
  }
};

module.exports = {
  removeInfrastructure,
  removeSite,
};
