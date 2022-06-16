const nock = require('nock');

const factory = require('./factory');

const url = 'https://api.example.com';
const reqheaders = {
  reqheaders: {
    authorization: /Bearer .+/,
  },
};

const mockCreateRoute = (resource, body) => nock(url, reqheaders)
  .post('/v2/routes', body)
  .reply(200, resource);

const mockDeleteRoute = (host, guid, exists = true) => {
  if (exists) {
    nock(url, reqheaders)
      .get(`/v2/routes?q=host:${host}`)
      .reply(200, {
        resources: [{
          metadata: { guid },
          entity: { host },
        }],
      });

    nock(url, reqheaders)
      .delete(`/v2/routes/${guid}?recursive=true&async=true`)
      .reply(200, { metadata: { guid } });
  } else {
    nock(url, reqheaders)
      .get(`/v2/routes?q=host:${host}`)
      .reply(200, {
        resources: [],
      });
  }
};

const mockDeleteService = (name, guid, exists = true) => {
  if (exists) {
    nock(url, reqheaders)
      .get(`/v2/service_instances?q=name:${name}`)
      .reply(200, {
        resources: [{
          metadata: { guid },
          entity: { name },
        }],
      });

    nock(url, reqheaders)
      .delete(`/v2/service_instances/${guid}?accepts_incomplete=true&recursive=true&async=true`)
      .reply(200, { metadata: { guid } });
  } else {
    nock(url, reqheaders)
      .get(`/v2/service_instances?q=name:${name}`)
      .reply(200, {
        resources: [],
      });
  }
};

const mockFetchServiceKeysRequest = resources => nock(url, reqheaders)
  .get('/v2/service_keys')
  .reply(200, resources);

const mockFetchServiceKeyRequest = (guid, resources) => nock(url, reqheaders)
  .get(`/v2/service_keys/${guid}`)
  .reply(200, resources);

const mockFetchServiceInstancesRequest = (resources, name = null) => nock(url, reqheaders)
  .get(`/v2/service_instances${name ? `?q=name:${name}` : ''}`)
  .reply(200, resources);

const mockFetchServiceInstanceCredentialsRequest = (guid, resources) => nock(url, reqheaders)
  .get(`/v2/service_instances/${guid}/service_keys`)
  .reply(200, resources);

const mockFetchS3ServicePlanGUID = resources => nock(url, reqheaders)
  .get('/v2/service_plans')
  .reply(200, resources);

const mockFetchSpacesRequest = (name, resources) => nock(url, reqheaders)
  .get(`/v3/spaces?names=${name}`)
  .reply(200, resources);

const mockDefaultCredentials = (exists = true) => {
  const serviceGuid = 'testing-guid';
  const serviceName = 'federalist-dev-s3';
  const instanceResponses = {
    resources: exists
      ? [factory.responses.service({ guid: serviceGuid }, { name: serviceName })] : [],
  };

  const keyResponses = {
    resources: exists
      ? [factory.responses.service({}, { credentials: factory.responses.credentials() })] : [],
  };

  nock(url, reqheaders)
    .persist()
    .get('/v2/service_instances?q=name:federalist-dev-s3')
    .reply(200, instanceResponses);

  nock(url, reqheaders)
    .persist()
    .get('/v2/service_instances?q=name:foo-s3-service')
    .reply(200, {
      resources: exists
        ? [factory.responses.service({ guid: serviceGuid }, { name: 'foo-s3-service' })] : [],
    });

  nock(url, reqheaders)
    .persist()
    .get(`/v2/service_instances/${serviceGuid}/service_keys`)
    .reply(200, keyResponses);
};

const mockCreateS3ServiceInstance = (body, resources) => {
  // eslint-disable-next-line camelcase
  const { name, service_plan_guid } = body;

  const n = nock(url, reqheaders)
    .filteringRequestBody(/.*/, '*')
    .post('/v2/service_instances?accepts_incomplete=true', '*');

  // eslint-disable-next-line camelcase
  if (!name || !service_plan_guid) {
    return n.reply(401, 'Bad request');
  }

  return n.reply(200, resources);
};

const mockCreateService = (
  { domains, name, origin, path, pageNotFound },
  resources
) => {
  const matcher = (body) =>
    body.name === name &&
    body.parameters.domains === domains &&
    body.parameters.origin === origin &&
    body.parameters.path === path &&
    body.metadata.annotations.domains === domains &&
    body.metadata.annotations.origin === origin &&
    body.metadata.annotations.path === path &&
    (pageNotFound
      ? body.metadata.annotations.error_responses ===
        `{ "404": "${pageNotFound}" }`
      : true) &&
    (pageNotFound
      ? body.parameters.error_responses === `{ "404": "${pageNotFound}" }`
      : true);

  return nock(url, reqheaders)
    .post("/v3/service_instances", matcher)
    .reply(200, resources);
};

const mockCreateServiceKey = (body, resources) => {
  // eslint-disable-next-line camelcase
  const { name, service_instance_guid } = body;

  const n = nock(url, reqheaders)
    .filteringRequestBody(/.*/, '*')
    .post('/v2/service_keys', '*');

  // eslint-disable-next-line camelcase
  if (!name || !service_instance_guid) {
    return n.reply(401, 'Bad request');
  }

  return n.reply(200, resources);
};

const mockMapRoute = resource => nock(url, reqheaders)
  .post('/v2/route_mappings')
  .reply(200, resource);

module.exports = {
  mockCreateRoute,
  mockCreateService,
  mockDeleteRoute,
  mockDeleteService,
  mockCreateS3ServiceInstance,
  mockCreateServiceKey,
  mockDefaultCredentials,
  mockFetchServiceInstancesRequest,
  mockFetchServiceInstanceCredentialsRequest,
  mockFetchServiceKeyRequest,
  mockFetchServiceKeysRequest,
  mockFetchSpacesRequest,
  mockFetchS3ServicePlanGUID,
  mockMapRoute,
};
