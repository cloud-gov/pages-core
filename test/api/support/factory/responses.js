const config = require('../../../../config');

const metadata = (overrides) =>
  Object.assign(
    {
      guid: 'test-guid',
    },
    overrides,
  );

const credentials = (overrides) =>
  Object.assign(
    {
      access_key_id: config.s3.accessKeyId,
      secret_access_key: config.s3.secretAccessKey,
      region: config.s3.region,
      bucket: config.s3.bucket,
    },
    overrides,
  );

module.exports.credentials = credentials;

const entity = (overrides) =>
  Object.assign(
    {
      name: 'test-service',
      service_plan_guid: 'test-service-plan-guid',
      credentials: credentials(),
      unique_id: config.app.s3ServicePlanId,
    },
    overrides,
  );

const service = (metadataOverrides, entityOverrides) => ({
  metadata: metadata(metadataOverrides),
  entity: entity(entityOverrides),
});

module.exports.service = service;
