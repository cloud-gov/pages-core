const { Site } = require('../models');
const CFApiClient = require('../utils/cfApiClient');
const CloudFoundryAuthClient = require('../utils/cfAuthClient');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function rotateBucketKey(site, cfApi, sleepNumber = 10000) {
  const serviceName = site.s3ServiceName;
  const serviceBindingName = `${serviceName}-key`;
  const serviceInstance = await cfApi.fetchServiceInstance(serviceName);
  const credentials = await cfApi
    .fetchCredentialBindingsInstance(serviceBindingName)
    .catch((error) => {
      // Return null to skip credentials delete if not found
      // fetchCredentialBindingsInstance throws error
      // with name string starting "Not found" when credentials
      // do not exist
      if (error.message.toLowerCase().trim().startsWith('not found')) {
        return null;
      }

      throw error;
    });

  if (credentials) {
    // Delete existing credential service if they exist
    await cfApi.deleteServiceInstanceCredentials(credentials.guid);
    // Sleep 10 seconds to allow service credential deletion
    await sleep(sleepNumber);
  }

  await cfApi.createServiceKey(serviceInstance.name, serviceInstance.guid);

  const now = new Date();
  await site.update({ awsBucketKeyUpdatedAt: now });

  return site;
}

async function rotateSitesBucketKeys({
  limit = 20, username, password, sleepNumber = 10000,
}) {
  const authClient = new CloudFoundryAuthClient({ username, password });
  const cfApi = new CFApiClient({ authClient });

  const sites = await Site.findAll({
    order: [['awsBucketKeyUpdatedAt', 'ASC']],
    limit,
  });

  return Promise.allSettled(sites.map(site => rotateBucketKey(site, cfApi, sleepNumber)));
}

module.exports = {
  rotateBucketKey,
  rotateSitesBucketKeys,
};
