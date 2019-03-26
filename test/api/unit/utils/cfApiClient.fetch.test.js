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

  describe('.fetchServiceInstanceCredentials', () => {
    it('should return the service key credentials instance by name', (done) => {
      const guid = 'testing-guid';
      const name = 'testing-service-name';
      const keyName = `${name}-key`;
      const credentials = responses.credentials({
        bucket: 'test-bucket',
        region: 'test-region',
        access_key_id: 'access-key-id',
        secret_access_key: 'secret-access-key',
      });

      const instanceResponses = {
        resources: [
          responses.service({ guid }, { name }),
          responses.service(),
          responses.service(),
        ],
      };

      const keyResponses = {
        resources: [
          responses.service(
            {},
            {
              name: keyName,
              credentials,
            }
          ),
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses);
      apiNocks.mockFetchServiceInstanceCredentialsRequest(guid, keyResponses);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstanceCredentials(name)
        .then((res) => {
          expect(res).to.deep.equal(credentials);
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
});
