const nock = require('nock');
const crypto = require('crypto');
const factory = require('./factory');

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
    resources: [factory.responses.service({}, { credentials: factory.responses.credentials() })],
  };

  nock(url, reqheaders)
    .persist()
    .get('/v2/service_instances')
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

const mockSiteCreator = (
  name,
  region = 'us-gov-west-1',
  bucket = 's3-bucket'
) => {
  const keyName = `${name}-key`;
  const planName = 'basic-public';
  const planGuid = 'plan-guid';
  const bucketGuid = 'bucket-guid';
  const accessKeyId = crypto.randomBytes(3).toString('hex');
  const secretAccessKey = crypto.randomBytes(3).toString('hex');

  const instanceRequestBody = { name, service_plan_guid: planGuid };
  const keyRequestBody = { name, service_instance_guid: bucketGuid };

  const planResponses = {
    resources: [
      factory.responses.service({ guid: planGuid }, { name: planName }),
    ],
  };
  const bucketResponse = factory.responses.service({ guid: bucketGuid }, { name });
  const keyResponse = factory.responses.service({}, {
    name: keyName,
    service_instance_guid: bucketGuid,
    credentials: factory.responses.credentials({
      access_key_id: accessKeyId,
      secret_access_key: secretAccessKey,
      region,
      bucket,
    }),
  });

  const buildResponses = {
    resources: [
      factory.responses.service({}, {
        name,
        service_instance_guid: bucketGuid,
        credentials: factory.responses.credentials({
          access_key_id: accessKeyId,
          secret_access_key: secretAccessKey,
          region,
          bucket,
        }),
      }),
    ],
  };

  const serviceCredentialsResponses = {
    resources: [keyResponse],
  };

  mockFetchS3ServicePlanGUID(planResponses);
  mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
  mockCreateServiceKey(keyRequestBody, keyResponse);
  mockFetchServiceInstancesRequest(buildResponses);
  mockFetchServiceInstanceCredentialsRequest('test-guid', serviceCredentialsResponses);
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
  mockSiteCreator,
};
