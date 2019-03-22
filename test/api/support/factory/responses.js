const metadata = overrides => Object.assign({
  guid: 'test-guid',
}, overrides);


const entity = overrides => Object.assign({
  name: 'test-service',
  service_plan_guid: 'test-service-plan-guid', // eslint-disable-line camelcase

}, overrides);

const service = (metadataOverides, entityOverides) => ({
  metadata: metadata(metadataOverides),
  entity: entity(entityOverides),
});

module.exports.service = service;
