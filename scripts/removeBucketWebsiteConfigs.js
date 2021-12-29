/* eslint-disable no-console */
const AWS = require('aws-sdk');
const PromisePool = require('@supercharge/promise-pool');
const { Site } = require('../api/models');
const CloudFoundryAPIClient = require('../api/utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

async function removeBucketWebsiteConfig(site) {
  const prefix = `${site.id} | ${site.owner}/${site.repository} | `;

  if (site.s3ServiceName) {
    try {
      const creds = await apiClient.fetchServiceInstanceCredentials(site.s3ServiceName);

      const {
        access_key_id: accessKeyId,
        bucket,
        region,
        secret_access_key: secretAccessKey,
      } = creds;

      if (site.awsBucketName && site.awsBucketName !== bucket) {
        throw new Error(`${prefix}S3 service bucket name ${bucket} does not match site bucket name ${site.awsBucketName}.`);
      }

      const s3 = new AWS.S3({
        accessKeyId,
        region,
        secretAccessKey,
        apiVersion: '2006-03-01',
      });

      await s3.deleteBucketWebsite({ Bucket: bucket }).promise();
    } catch (error) {
      throw new Error(`${prefix}${error.message}.`);
    }
  } else {
    console.log(`${prefix}S3 service name not specified.`);
  }
}

async function removeBucketWebsiteConfigs() {
  const sites = await Site.findAll({
    paranoid: false, // include "deleted" sites
  });

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(sites)
    .process(removeBucketWebsiteConfig);

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
