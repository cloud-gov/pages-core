const nock = require('nock');
const factory = require('./factory');

const url = 'https://api.example.com';
const reqheaders = {
  reqheaders: {
    authorization: /Bearer .+/,
  },
};

const mockDeleteRoute = (host, guid, exists = true) => {
  const routeResource = factory.createCFAPIResource({ guid, host });
  const listRoutesResponse = factory.createCFAPIResourceList({
    resources: [routeResource],
  });

  if (exists) {
    nock(url, reqheaders).get(`/v3/routes?hosts=${host}`).reply(200, listRoutesResponse);

    nock(url, reqheaders).delete(`/v3/routes/${guid}`).reply(200, routeResource);
  } else {
    nock(url, reqheaders).get(`/v3/routes?hosts=${host}`).reply(200, {
      resources: [],
    });
  }
};

const mockDeleteService = (name, guid, exists = true) => {
  const serviceResource = factory.createCFAPIResource({ name, guid });
  const listServices = factory.createCFAPIResourceList({
    resources: [serviceResource],
  });
  if (exists) {
    nock(url, reqheaders)
      .get(`/v3/service_instances?names=${name}`)
      .reply(200, listServices);

    nock(url, reqheaders)
      .delete(`/v3/service_instances/${guid}`)
      .reply(200, serviceResource);
  } else {
    nock(url, reqheaders).get(`/v3/service_instances?names=${name}`).reply(200, {
      resources: [],
    });
  }
};

const mockFetchServiceInstancesRequest = (resources, name = null) =>
  nock(url, reqheaders)
    .get(`/v3/service_instances${name ? `?names=${name}` : ''}`)
    .reply(200, resources);

const mockFetchServiceInstanceCredentialsRequest = (
  serviceInstanceName,
  { guid, credentials },
) => {
  const credentialsServiceInstance = factory.createCFAPIResource({ guid });
  const listCredentialServices = factory.createCFAPIResourceList({
    resources: [credentialsServiceInstance],
  });

  nock(url, reqheaders)
    .persist()
    .get(`/v3/service_credential_bindings?service_instance_names=${serviceInstanceName}`)
    .reply(200, listCredentialServices);

  nock(url, reqheaders)
    .persist()
    .get(`/v3/service_credential_bindings/${guid}/details`)
    .reply(200, {
      credentials,
    });
};

const mockFetchS3ServicePlanGUID = (resources, name) =>
  nock(url, reqheaders).get(`/v3/service_plans?names=${name}`).reply(200, resources);

const mockFetchSpacesRequest = (name, resources) =>
  nock(url, reqheaders).get(`/v3/spaces?names=${name}`).reply(200, resources);

const mockDefaultCredentials = (exists = true) => {
  const serviceGuid = 'testing-guid';
  const serviceName = 'federalist-dev-s3';
  const credentials = exists ? factory.responses.credentials() : [];

  return mockFetchServiceInstanceCredentialsRequest(serviceName, {
    guid: serviceGuid,
    credentials,
  });
};

const mockCreateS3ServiceInstance = ({ name, service_plan_guid }, resources) => {
  const matcher = (body) => {
    return (
      body.name === name &&
      body.relationships.service_plan.data.guid === service_plan_guid
    );
  };

  return nock(url, reqheaders)
    .post('/v3/service_instances', matcher)
    .reply(200, resources);
};

const mockCreateService = ({ domains, name, origin, path }, resources) => {
  const matcher = (body) =>
    body.name === name &&
    body.parameters.domains === domains &&
    body.parameters.origin === origin &&
    body.parameters.path === path;

  return nock(url, reqheaders)
    .post('/v3/service_instances', matcher)
    .reply(200, resources);
};

const mockCreateServiceKey = ({ name, serviceInstanceGuid }, resources) => {
  const matcher = (body) =>
    body.type === 'key' &&
    body.name === name &&
    body.relationships.service_instance.data.guid === serviceInstanceGuid;

  nock(url, reqheaders).post('/v3/service_credential_bindings', matcher).reply(200, '');

  nock(url, reqheaders)
    .get(`/v3/service_credential_bindings?names=${name}`)
    .reply(200, {
      resources: [resources],
    });
};

const mockCreateServiceKeyPost = ({ name, serviceInstanceGuid }) => {
  const matcher = (body) =>
    body.type === 'key' &&
    body.name === name &&
    body.relationships.service_instance.data.guid === serviceInstanceGuid;

  nock(url, reqheaders).post('/v3/service_credential_bindings', matcher).reply(200);
};

const mockDeleteCredentialBindingsInstance = (guid) => {
  const endpoint = `/v3/service_credential_bindings/${guid}`;

  nock(url, reqheaders).delete(endpoint).reply(200);
};

const mockfetchCredentialBindingsInstance = (name, { guid, credentials }) => {
  const endpoint = `/v3/service_credential_bindings?names=${name}`;
  const response = factory.createCFAPIResource({
    name,
    guid,
    credentials,
  });

  const resourcesResponse = factory.createCFAPIResourceList({
    resources: [response],
  });

  nock(url, reqheaders).get(endpoint).reply(200, resourcesResponse);
};

const mockfetchCredentialBindingsInstanceEmpty = (name) => {
  const endpoint = `/v3/service_credential_bindings?names=${name}`;

  const resourcesResponse = factory.createCFAPIResourceList({
    resources: [],
  });

  nock(url, reqheaders).get(endpoint).reply(200, resourcesResponse);
};

const mockBucketKeyRotator = ({
  serviceInstanceName,
  serviceInstanceGuid,
  credentialsInstance,
}) => {
  const credentialsName = `${serviceInstanceName}-key`;
  const instance1 = factory.createCFAPIResource({
    name: serviceInstanceName,
    guid: serviceInstanceGuid,
  });
  const resourcesResponses = factory.createCFAPIResourceList({
    resources: [instance1],
  });

  mockFetchServiceInstancesRequest(resourcesResponses, serviceInstanceName);

  if (credentialsInstance) {
    mockfetchCredentialBindingsInstance(credentialsName, credentialsInstance);
    mockDeleteCredentialBindingsInstance(credentialsInstance.guid);
  } else {
    mockfetchCredentialBindingsInstanceEmpty(credentialsName);
  }

  const matcher = (body) =>
    body.type === 'key' &&
    body.name === credentialsName &&
    body.relationships.service_instance.data.guid === serviceInstanceGuid;

  nock(url, reqheaders).post('/v3/service_credential_bindings', matcher).reply(200, '');
};

module.exports = {
  mockCreateService,
  mockDeleteRoute,
  mockDeleteService,
  mockCreateS3ServiceInstance,
  mockCreateServiceKey,
  mockCreateServiceKeyPost,
  mockDefaultCredentials,
  mockFetchServiceInstancesRequest,
  mockFetchServiceInstanceCredentialsRequest,
  mockFetchSpacesRequest,
  mockFetchS3ServicePlanGUID,
  mockBucketKeyRotator,
};
