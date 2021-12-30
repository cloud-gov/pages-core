/* eslint-disable no-console */
const AWS = require('aws-sdk');
const PromisePool = require('@supercharge/promise-pool');
const { Site } = require('../api/models');
const CloudFoundryAPIClient = require('../api/utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

async function removeBucketWebsiteConfig(site) {
  const creds = await apiClient.fetchServiceInstanceCredentials(site.s3ServiceName);

  const {
    access_key_id: accessKeyId,
    bucket,
    region,
    secret_access_key: secretAccessKey,
  } = creds;

  if (site.awsBucketName && site.awsBucketName !== bucket) {
    throw new Error(`S3 service bucket name ${bucket} does not match site bucket name ${site.awsBucketName}.`);
  }

  const s3 = new AWS.S3({
    accessKeyId,
    region,
    secretAccessKey,
    apiVersion: '2006-03-01',
  });

  await s3.deleteBucketWebsite({ Bucket: bucket }).promise();
}

async function runRemoveBucketWebsiteConfig(site) {
  if (!site.s3ServiceName) {
    return;
  }

  try {
    await removeBucketWebsiteConfig(site);
  } catch (error) {
    // ignore errors for deleted sites
    if (!site.isSoftDeleted()) {
      const prefix = `${site.owner}/${site.repository} | `;
      throw new Error(`${prefix}${error.message}`);
    }
  }
}

async function removeBucketWebsiteConfigs() {
  const sites = await Site.findAll({
    paranoid: false, // include "deleted" sites
  });

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(sites)
    .process(runRemoveBucketWebsiteConfig);

  if (errors.length === 0) {
    console.log('Remove bucket website configs successful!!');
    return;
  }

  errors.forEach(({ item, message }) => console.error(`${item.id}: ${message}`));

  throw new Error('Remove bucket website configs completed with errors, see above for details.');
}

removeBucketWebsiteConfigs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
