const factory = require('../../../test/api/support/factory');

const { MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, SITES_SERVICE_NAMES } = process.env;

const servicesList = SITES_SERVICE_NAMES.split(',');

function createResponse() {
  const resources = servicesList.map((name) => {
    return factory.createCFAPIResource({ name, guid: name });
  });

  return factory.createCFAPIResourceList({ resources: resources });
}

function createS3ServiceInstanaces() {
  const response = createResponse();

  return response;
}

function createS3ServiceBindings(name) {
  const response = createResponse();

  if (!name) {
    return response;
  }

  const resource = response.resources.filter((resource) => resource.name === name);

  return factory.createCFAPIResourceList({ resources: resource });
}

function createS3ServiceBindingDetails(guid) {
  const response = createResponse();
  const resource = response.resources.find((resource) => resource.guid === guid);

  if (!resource) {
    throw 'Service binding not found';
  }

  // Use the resource name for the bucket name since they are the same locally
  return {
    credentials: {
      access_key_id: MINIO_ROOT_USER,
      secret_access_key: MINIO_ROOT_PASSWORD,
      region: 'us-gov-west-1',
      bucket: resource.name,
    },
  };
}

module.exports = {
  createS3ServiceInstanaces,
  createS3ServiceBindings,
  createS3ServiceBindingDetails,
};
