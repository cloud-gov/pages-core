const nock = require('nock');

const url = 'https://api.example.com';
const reqheaders = {
  reqheaders: {
    authorization: /Bearer .+/,
  },
};

const mockFetchServiceKeysRequest = resources => nock(url, reqheaders)
  .get('/v2/service_keys')
  .reply(200, resources);

module.exports.mockFetchServiceKeysRequest = mockFetchServiceKeysRequest;

const mockFetchServiceKeyRequest = (guid, resources) => nock(url, reqheaders)
  .get(`/v2/service_keys/${guid}`)
  .reply(200, resources);

module.exports.mockFetchServiceKeyRequest = mockFetchServiceKeyRequest;

const mockFetchServiceInstancesRequest = resources => nock(url, reqheaders)
  .get('/v2/service_instances')
  .reply(200, resources);

module.exports.mockFetchServiceInstancesRequest = mockFetchServiceInstancesRequest;

const mockFetchS3ServicePlanGUID = resources => nock(url, reqheaders)
  .get('/v2/service_plans')
  .reply(200, resources);

module.exports.mockFetchS3ServicePlanGUID = mockFetchS3ServicePlanGUID;

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

module.exports.mockCreateS3ServiceInstance = mockCreateS3ServiceInstance;

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

module.exports.mockCreateServiceKey = mockCreateServiceKey;
