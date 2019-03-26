const metadata = overrides => Object.assign({
  guid: 'test-guid',
}, overrides);

const credentials = overrides => Object.assign({
  access_key_id: 'the-access-key-id',
  secret_access_key: 'the-secret-access-key',
  region: 'us-gov-west-1',
  bucket: 'test-bucket',
}, overrides);

module.exports.credentials = credentials;

const entity = overrides => Object.assign({
  name: 'test-service',
  service_plan_guid: 'test-service-plan-guid',
  credentials: credentials(),
}, overrides);

const service = (metadataOverrides, entityOverrides) => ({
  metadata: metadata(metadataOverrides),
  entity: entity(entityOverrides),
});

module.exports.service = service;
