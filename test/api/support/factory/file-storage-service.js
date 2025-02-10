const organization = require('./organization');
const { FileStorageService } = require('../../../../api/models');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${counters[key]}`;
}

async function build(params = {}) {
  let { name, org, siteId, metadata, serviceId, serviceName } = params;

  if (!name) {
    name = increment('file-storage-service');
  }

  if (!serviceId) {
    serviceId = increment('service-id-');
  }

  if (!serviceName) {
    serviceName = increment('service-name-');
  }

  if (!org) {
    org = await organization.create();
  }

  return FileStorageService.create({
    name,
    organizationId: org.id,
    siteId,
    serviceId,
    serviceName,
    metadata,
  });
}

function create(params) {
  return build(params);
}

function truncate() {
  return FileStorageService.truncate({
    force: true,
    cascade: true,
  });
}

module.exports = {
  build,
  create,
  truncate,
};
