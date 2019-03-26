const nock = require('nock');
const factory = require('./factory');
const config = require('../../../config');

const url = 'https://api.example.com';
const reqheaders = {
  reqheaders: {
    authorization: /Bearer .+/,
  },
};

const mockFetchServiceKeysRequest = resources => nock(url, reqheaders)
  .get('/v2/service_keys')
  .reply(200, resources);

const mockFetchServiceKeyRequest = (guid, resources) => nock(url, reqheaders)
  .get(`/v2/service_keys/${guid}`)
  .reply(200, resources);

const mockFetchServiceInstancesRequest = resources => nock(url, reqheaders)
  .get('/v2/service_instances')
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
    resources: [factory.responses.service({}, { credentials: config.s3 })],
  };

  mockFetchServiceInstancesRequest(instanceResponses);
  mockFetchServiceInstanceCredentialsRequest(serviceGuid, keyResponses);
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

module.exports = {
  mockCreateS3ServiceInstance,
  mockCreateServiceKey,
  mockDefaultCredentials,
  mockFetchServiceInstancesRequest,
  mockFetchServiceInstanceCredentialsRequest,
  mockFetchServiceKeyRequest,
  mockFetchServiceKeysRequest,
  mockFetchS3ServicePlanGUID,
};
