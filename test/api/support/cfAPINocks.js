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

const mockDeleteRoute = (host, guid) => {
  nock(url, reqheaders)
    .get('/v2/routes')
    .reply(200, {
      resources: [{
        metadata: { guid },
        entity: { host },
      }],
    });

  nock(url, reqheaders)
    .delete(`/v2/routes/${guid}?recursive=true&async=true`)
    .reply(200, { metadata: { guid } });
};

const mockDeleteService = (name, guid) => {
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

const mockDefaultCredentials = () => {
  const serviceGuid = 'testing-guid';
  const serviceName = 'federalist-dev-s3';
  const instanceResponses = {
    resources: [factory.responses.service({ guid: serviceGuid }, { name: serviceName })],
  };

  const keyResponses = {
    resources: [factory.responses.service({}, { credentials: factory.responses.credentials() })],
  };

  nock(url, reqheaders)
    .persist()
    .get('/v2/service_instances?q=name:federalist-dev-s3')
    .reply(200, instanceResponses);

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
  mockDeleteRoute,
  mockDeleteService,
  mockCreateS3ServiceInstance,
  mockCreateServiceKey,
  mockDefaultCredentials,
  mockFetchServiceInstancesRequest,
  mockFetchServiceInstanceCredentialsRequest,
  mockFetchServiceKeyRequest,
  mockFetchServiceKeysRequest,
  mockFetchS3ServicePlanGUID,
  mockMapRoute,
};
