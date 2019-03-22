const { expect } = require('chai');
const nock = require('nock');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const responses = require('../../support/factory/responses');

describe('CloudFoundryAPIClient', () => {
  afterEach(() => nock.cleanAll());

  describe('.fetchServiceInstances', () => {
    it('should return the service instances for a space', (done) => {
      const instanceResponses = {
        resources: [
          responses.service(),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstances()
        .then((res) => {
          expect(res).to.deep.equal(instanceResponses);
          done();
        });
    });
  });

  describe('.fetchServiceInstance', () => {
    it('should return the service instance by name', (done) => {
      const guid = 'testing-guid';
      const name = 'testing-service-name';

      const instanceResponses = {
        resources: [
          responses.service({ guid }, { name }),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstance(name)
        .then((res) => {
          expect(res).to.deep.equal(instanceResponses.resources[0]);
          done();
        });
    });

    it('should reject when service instance does not exist', (done) => {
      const name = 'not-an-instance';

      const message = new Error({
        message: 'Not found',
        name,
        field: 'name',
      });

      const instancesResponse = {
        resources: [
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instancesResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstance(name)
        .catch((err) => {
          expect(err).to.deep.equal(message);
          done();
        });
    });
  });

  describe('.fetchServiceKeys', () => {
    it('should return the service keys for a space', (done) => {
      const keyResponses = {
        resources: [
          responses.service(),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceKeysRequest(keyResponses);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceKeys()
        .then((res) => {
          expect(res).to.deep.equal(keyResponses);
          done();
        });
    });
  });

  describe('.fetchServiceKey', () => {
    it('should return the service key by name', (done) => {
      const guid = 'testing-guid';
      const name = 'testing-service-name';

      const keyResponses = {
        resources: [
          responses.service({ guid }, { name }),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceKeysRequest(keyResponses);
      apiNocks.mockFetchServiceKeyRequest(guid, keyResponses.resources[0]);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceKey(name)
        .then((res) => {
          expect(res).to.deep.equal(keyResponses.resources[0]);
          done();
        });
    });

    it('should reject when service key does not exist', (done) => {
      const name = 'not-a-key';

      const message = new Error({
        message: 'Not found',
        name,
        field: 'name',
      });

      const keysResponse = {
        resources: [
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceKeysRequest(keysResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceKey(name)
        .catch((err) => {
          expect(err).to.deep.equal(message);
          done();
        });
    });
  });

  describe('.fetchS3ServicePlanGUID', () => {
    it('should return the service plan guid by name', (done) => {
      const guid = 'testing-guid';
      const name = 'testing-service-name';

      const response = {
        resources: [
          responses.service({ guid }, { name }),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchS3ServicePlanGUID(name)
        .then((res) => {
          expect(res).to.deep.equal(guid);
          done();
        });
    });

    it('should reject when service plan is not found', (done) => {
      const name = 'not-a-service-plan';

      const message = new Error({
        message: 'Not found',
        name,
        field: 'name',
      });

      const response = {
        resources: [
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchS3ServicePlanGUID(name)
        .catch((err) => {
          expect(err).to.deep.equal(message);
          done();
        });
    });
  });

  describe('.createS3ServiceInstance', () => {
    it('should return a new service plan', (done) => {
      const name = 'my-bucket';
      const planName = 'aws-bucket';
      const planGuid = 'plan-guid';

      const requestBody = { name, service_plan_guid: planGuid };

      const planResponses = {
        resources: [
          responses.service({ guid: planGuid }, { name: planName }),
        ],
      };
      const serviceResponse = responses.service({}, { name });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponses);
      apiNocks.mockCreateS3ServiceInstance(requestBody, serviceResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createS3ServiceInstance(name, planName)
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.entity.name).to.equal(name);
          done();
        });
    });

    it('should return 400 when missing name or service plan name', (done) => {
      const name = undefined;
      const serviceName = 'service-name';

      const requestBody = {};

      const planResponse = {
        resources: [
          responses.service(undefined, { name: serviceName }),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponse);
      apiNocks.mockCreateS3ServiceInstance(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createS3ServiceInstance(name, serviceName)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.createServiceKey', () => {
    it('should return a new service key', (done) => {
      const name = 'my-service-instance';
      const keyName = `${name}-key`;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {
        name,
        service_instance_guid: serviceInstanceGuid,
      };

      const response = responses.service({}, {
        name: keyName,
        service_instance_guid: serviceInstanceGuid,
      });

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody, response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid)
        .then((res) => {
          expect(res).to.deep.equal(response);
          done();
        });
    });

    it('should return a new service key with custom key name', (done) => {
      const name = 'my-service-instance';
      const customKeyName = 'super-key';
      const keyName = `${name}-${customKeyName}`;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {
        name,
        service_instance_guid: serviceInstanceGuid,
      };

      const response = responses.service({}, {
        name: keyName,
        service_instance_guid: serviceInstanceGuid,
      });

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody, response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid, customKeyName)
        .then((res) => {
          expect(res).to.deep.equal(response);
          done();
        });
    });

    it('should return 400 when missing name or service instance guid', (done) => {
      const name = undefined;
      const serviceInstanceGuid = 'service-instance-guid';

      const requestBody = {};

      mockTokenRequest();
      apiNocks.mockCreateServiceKey(requestBody);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createServiceKey(name, serviceInstanceGuid)
        .catch((err) => {
          expect(err).to.be.an('error');
          done();
        });
    });
  });

  describe('.creatSiteBucket', () => {
    it('should create a new S3 service and service key', (done) => {
      const name = 'my-bucket';
      const keyName = `${name}-key`;
      const planName = 'aws-bucket';
      const planGuid = 'plan-guid';
      const bucketGuid = 'bucket-guid';

      const instanceRequestBody = { name, service_plan_guid: planGuid };
      const keyRequestBody = { name, service_instance_guid: bucketGuid };

      const planResponses = {
        resources: [
          responses.service({ guid: planGuid }, { name: planName }),
        ],
      };
      const bucketResponse = responses.service({ guid: bucketGuid }, { name });
      const keyResponse = responses.service({}, {
        name: keyName,
        service_instance_guid: bucketGuid,
      });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(planResponses);
      apiNocks.mockCreateS3ServiceInstance(instanceRequestBody, bucketResponse);
      apiNocks.mockCreateServiceKey(keyRequestBody, keyResponse);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.createSiteBucket(name, planName)
        .then((res) => {
          expect(res).to.be.an('object');
          expect(res.entity.name).to.equal(keyName);
          expect(res.entity.service_instance_guid).to.equal(bucketGuid);
          done();
        });
    });
  });
});
