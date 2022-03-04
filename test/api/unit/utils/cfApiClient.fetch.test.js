const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const config = require('../../../../config');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const responses = require('../../support/factory/responses');

describe('CloudFoundryAPIClient', () => {
  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

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
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstance(name)
        .then((res) => {
          expect(res).to.deep.equal(instanceResponses.resources[0]);
          done();
        });
    });

    it('should reject when service instance does not exist', (done) => {
      const name = 'not-an-instance';

      const message = `Not found: Entity @name = ${name}`;

      const instancesResponse = {
        resources: [
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instancesResponse, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstance(name)
        .catch((err) => {
          expect(err.message).to.deep.equal(message);
          expect(err.name).to.equal(name);
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
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses, name);
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

      const message = `Not found: Entity @name = ${name}`;

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
          expect(err.message).to.equal(message);
          expect(err.name).to.equal(name);
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
      apiClient.fetchS3ServicePlanGUID(name, config.env.s3ServicePlanId)
        .then((res) => {
          expect(res).to.deep.equal(guid);
          done();
        });
    });

    it('should reject when service plan is not found', (done) => {
      const name = 'not-a-service-plan';

      const message = `Not found: Entity @name = ${name}`;

      const response = {
        resources: [
          responses.service(),
          responses.service(),
        ],
      };

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(response);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchS3ServicePlanGUID(name, config.env.s3ServicePlanId)
        .catch((err) => {
          expect(err.message).to.equal(message);
          expect(err.name).to.equal(name);
          done();
        });
    });
  });

  describe('.fetchBuildTask', () => {
    it('returns the value of `fetchTaskByName` with the correct name', async () => {
      const stubResult = 'foo';
      const buildId = 23423;

      const apiClient = new CloudFoundryAPIClient();

      const fetchTaskByNameStub = sinon.stub(apiClient, 'fetchTaskByName');
      fetchTaskByNameStub.resolves(stubResult);

      const result = await apiClient.fetchBuildTask(buildId);

      sinon.assert.calledOnceWithExactly(fetchTaskByNameStub, `build-${buildId}`);
      expect(result).to.equal(stubResult);
    });
  });

  describe('.fetchTaskByName', () => {
    describe('when the task is found', () => {
      it('returns the only the named task from the results of `fetchTasks`', async () => {
        const name = 'foo';
        const stubResult = [
          { name },
          { name: 'bar' },
        ];

        const apiClient = new CloudFoundryAPIClient();

        const fetchTasksStub = sinon.stub(apiClient, 'fetchTasks');
        fetchTasksStub.resolves(stubResult);

        const result = await apiClient.fetchTaskByName(name);

        expect(result).to.deep.equal({ name });
        sinon.assert.calledOnceWithExactly(fetchTasksStub, { names: name });
      });
    });

    describe('when the task is not found', () => {
      it('returns undefined', async () => {
        const name = 'foo';
        const stubResult = [
          { name: 'baz' },
          { name: 'bar' },
        ];

        const apiClient = new CloudFoundryAPIClient();

        const fetchTasksStub = sinon.stub(apiClient, 'fetchTasks');
        fetchTasksStub.resolves(stubResult);

        const result = await apiClient.fetchTaskByName(name);

        sinon.assert.calledOnceWithExactly(fetchTasksStub, { names: name });
        expect(result).to.be.undefined;
      });
    });
  });

  describe('.fetchTasks', () => {
    it('makes an authenticated request to the GET tasks endpoint with appropriate query parameters', async () => {
      const tasks = [
        { name: 'foo' },
        { name: 'bar' },
      ];
      const stubResult = { resources: tasks };

      const apiClient = new CloudFoundryAPIClient();

      const authRequestStub = sinon.stub(apiClient, 'authRequest');
      authRequestStub.resolves(stubResult);

      const result = await apiClient.fetchTasks({ names: 'foo' });

      sinon.assert.calledOnceWithExactly(authRequestStub, 'GET', '/v3/tasks?names=foo');
      expect(result).to.deep.equal(tasks);
    });
  });

  describe('cancelBuildTask', () => {
    describe('when successful', () => {
      it('fetches the build task and cancels it', async () => {
        const buildId = 12345;
        const taskGuid = 'abc123';

        const apiClient = new CloudFoundryAPIClient();
        const fetchBuildTaskStub = sinon.stub(apiClient, 'fetchBuildTask');
        fetchBuildTaskStub.resolves({ guid: taskGuid });

        const cancelTaskStub = sinon.stub(apiClient, 'cancelTask');
        cancelTaskStub.resolves();

        await apiClient.cancelBuildTask(buildId);

        sinon.assert.calledOnceWithExactly(fetchBuildTaskStub, buildId);
        sinon.assert.calledOnceWithExactly(cancelTaskStub, taskGuid);
      });
    });

    describe('when the task does not exist', async () => {
      it('throws and does not try to cancel the task', async () => {
        const buildId = 12345;

        const apiClient = new CloudFoundryAPIClient();
        const fetchBuildTaskStub = sinon.stub(apiClient, 'fetchBuildTask');
        fetchBuildTaskStub.resolves(undefined);

        const cancelTaskStub = sinon.stub(apiClient, 'cancelTask');
        cancelTaskStub.resolves();

        const error = await apiClient.cancelBuildTask(buildId).catch(e => e);

        sinon.assert.calledOnceWithExactly(fetchBuildTaskStub, buildId);
        sinon.assert.notCalled(cancelTaskStub);
        expect(error).to.be.an('error');
      });
    });

    describe('when the task has already completed', () => {
      it('throws', async () => {
        const buildId = 12345;
        const taskGuid = 'abc123';

        const apiClient = new CloudFoundryAPIClient();
        const fetchBuildTaskStub = sinon.stub(apiClient, 'fetchBuildTask');
        fetchBuildTaskStub.resolves({ guid: taskGuid });

        const cancelTaskStub = sinon.stub(apiClient, 'cancelTask');
        cancelTaskStub.rejects();

        const error = await apiClient.cancelBuildTask(buildId).catch(e => e);

        sinon.assert.calledOnceWithExactly(fetchBuildTaskStub, buildId);
        sinon.assert.calledOnceWithExactly(cancelTaskStub, taskGuid);
        expect(error).to.be.an('error');
      });
    });
  });

  describe('.cancelTask', () => {
    it('makes an authenticated request to the task cancel endpoint', async () => {
      const taskGuid = 'abc123';

      const apiClient = new CloudFoundryAPIClient();

      const authRequestStub = sinon.stub(apiClient, 'authRequest');
      authRequestStub.resolves();

      await apiClient.cancelTask(taskGuid);

      sinon.assert.calledOnceWithExactly(authRequestStub, 'POST', `/v3/tasks/${taskGuid}/actions/cancel`);
    });
  });
});
