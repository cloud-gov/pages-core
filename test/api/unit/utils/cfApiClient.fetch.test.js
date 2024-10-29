const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const config = require('../../../../config');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const mockTokenRequest = require('../../support/cfAuthNock');
const apiNocks = require('../../support/cfAPINocks');
const factory = require('../../support/factory');

describe('CloudFoundryAPIClient', () => {
  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  describe('.fetchServiceInstances', () => {
    it('should return the service instances for a space', (done) => {
      const instance1 = factory.createCFAPIResource();
      const instance2 = factory.createCFAPIResource();
      const instance3 = factory.createCFAPIResource();
      const instanceResponses = factory.createCFAPIResourceList({
        resources: [instance1, instance2, instance3],
      });

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses);

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .fetchServiceInstances()
        .then((res) => {
          expect(res).to.deep.equal(instanceResponses);
          done();
        })
        .catch(done);
    });
  });

  describe('.fetchServiceInstance', () => {
    it('should return the service instance by name', (done) => {
      const name = 'testing-service-name';

      const instance1 = factory.createCFAPIResource({ name });
      const instance2 = factory.createCFAPIResource();
      const instance3 = factory.createCFAPIResource();
      const instanceResponses = factory.createCFAPIResourceList({
        resources: [instance1, instance2, instance3],
      });

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .fetchServiceInstances(name)
        .then((res) => {
          expect(res).to.deep.equal(instanceResponses);
          done();
        })
        .catch(done);
    });

    it('should reject when service instance does not exist', (done) => {
      const name = 'not-an-instance';
      const message = `Not found: Entity @name = ${name}`;
      const instance1 = factory.createCFAPIResource();
      const instance2 = factory.createCFAPIResource();
      const instance3 = factory.createCFAPIResource();
      const instanceResponses = factory.createCFAPIResourceList({
        resources: [instance1, instance2, instance3],
      });

      mockTokenRequest();
      apiNocks.mockFetchServiceInstancesRequest(instanceResponses, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchServiceInstance(name).catch((err) => {
        expect(err.message).to.deep.equal(message);
        expect(err.name).to.equal(name);
        done();
      });
    });
  });

  describe('.fetchServiceInstanceCredentials', () => {
    it('should return the service key credentials instance by name', (done) => {
      const serviceInstanceName = 'testing-service-name';
      const keyGuid = 'testing-guid';
      const keyCredentials = {
        bucket: 'test-bucket',
        region: 'test-region',
        access_key_id: 'access-key-id',
        secret_access_key: 'secret-access-key',
      };

      const keyResponse = {
        guid: keyGuid,
        credentials: keyCredentials,
      };

      mockTokenRequest();
      apiNocks.mockFetchServiceInstanceCredentialsRequest(
        serviceInstanceName,
        keyResponse,
      );

      const apiClient = new CloudFoundryAPIClient();
      apiClient
        .fetchServiceInstanceCredentials(serviceInstanceName)
        .then((res) => {
          expect(res).to.deep.equal(keyCredentials);
          done();
        })
        .catch(done);
    });
  });

  describe('.fetchS3ServicePlanGUID', () => {
    it('should return the service plan guid by name', (done) => {
      const guid = 'testing-guid';
      const name = 'testing-service-name';

      const response = factory.createCFAPIResourceList({
        resources: [
          factory.createCFAPIResource({
            guid,
            name,
          }),
          factory.createCFAPIResource(),
          factory.createCFAPIResource(),
        ],
      });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(response, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchS3ServicePlanGUID(name, config.env.s3ServicePlanId).then((res) => {
        expect(res).to.deep.equal(guid);
        done();
      });
    });

    it('should reject when service plan is not found', (done) => {
      const name = 'not-a-service-plan';
      const message = `Not found: @${name} service plan.`;
      const response = factory.createCFAPIResourceList({
        resources: [],
      });

      mockTokenRequest();
      apiNocks.mockFetchS3ServicePlanGUID(response, name);

      const apiClient = new CloudFoundryAPIClient();
      apiClient.fetchS3ServicePlanGUID(name, config.env.s3ServicePlanId).catch((err) => {
        expect(err.name).to.equal(message);
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

  describe('.fetchTaskByGuid', () => {
    describe('when the task is found', () => {
      it('returns the task', async () => {
        const guid = 'foo';
        const stubArg1 = 'GET';
        const stubArg2 = `/v3/tasks/${guid}`;
        const stubResult = {
          guid,
        };

        const apiClient = new CloudFoundryAPIClient();

        const fetchTasksStub = sinon.stub(apiClient, 'authRequest');
        fetchTasksStub.resolves(stubResult);

        const result = await apiClient.fetchTaskByGuid(guid);

        expect(result).to.deep.equal({
          guid,
        });
        sinon.assert.calledOnceWithExactly(fetchTasksStub, stubArg1, stubArg2);
      });
    });

    describe('when the task is not found', () => {
      it('returns null', async () => {
        const guid = 'foo';
        const stubArg1 = 'GET';
        const stubArg2 = `/v3/tasks/${guid}`;
        const stubResult = {
          errors: [],
        };

        const apiClient = new CloudFoundryAPIClient();

        const fetchTasksStub = sinon.stub(apiClient, 'authRequest');
        fetchTasksStub.resolves(stubResult);

        const result = await apiClient.fetchTaskByGuid(guid);

        sinon.assert.calledOnceWithExactly(fetchTasksStub, stubArg1, stubArg2);
        expect(result).to.be.null;
      });
    });
  });

  describe('.fetchTaskByName', () => {
    describe('when the task is found', () => {
      it('returns the only the named task from the results of `fetchTasks`', async () => {
        const name = 'foo';
        const stubResult = [{ name }, { name: 'bar' }];

        const apiClient = new CloudFoundryAPIClient();

        const fetchTasksStub = sinon.stub(apiClient, 'fetchTasks');
        fetchTasksStub.resolves(stubResult);

        const result = await apiClient.fetchTaskByName(name);

        expect(result).to.deep.equal({
          name,
        });
        sinon.assert.calledOnceWithExactly(fetchTasksStub, { names: name });
      });
    });

    describe('when the task is not found', () => {
      it('returns undefined', async () => {
        const name = 'foo';
        const stubResult = [{ name: 'baz' }, { name: 'bar' }];

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
    it(`makes an authenticated request to the GET tasks
        endpoint with appropriate query parameters`, async () => {
      const tasks = [{ name: 'foo' }, { name: 'bar' }];
      const stubResult = {
        resources: tasks,
      };

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

        const error = await apiClient.cancelBuildTask(buildId).catch((e) => e);

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

        const error = await apiClient.cancelBuildTask(buildId).catch((e) => e);

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

      sinon.assert.calledOnceWithExactly(
        authRequestStub,
        'POST',
        `/v3/tasks/${taskGuid}/actions/cancel`,
      );
    });
  });

  describe('.pollTaskStatus', () => {
    it('throws an error if the task does not exist', async () => {
      const taskGuid = 'abc123';
      const apiClient = new CloudFoundryAPIClient();

      const stub = sinon.stub(apiClient, 'fetchTaskByGuid');
      stub.resolves(null);

      const response = await apiClient.pollTaskStatus(taskGuid).catch((err) => err);

      expect(response).to.throw;
      expect(response.message).to.equal('Task not found');
      sinon.assert.calledOnceWithExactly(stub, taskGuid);
    });

    it('throws an error if pollTaskStatus times out', async () => {
      const taskGuid = 'abc123';
      const status = {
        state: 'PENDING',
      };
      const apiClient = new CloudFoundryAPIClient();

      const stubStatus = sinon.stub(apiClient, 'fetchTaskByGuid');
      stubStatus.resolves(status);

      const stubCancelTask = sinon.stub(apiClient, 'cancelTask');
      stubCancelTask.resolves();

      const response = await apiClient
        .pollTaskStatus(taskGuid, {
          totalAttempts: 5,
          sleepInterval: 0,
        })
        .catch((err) => err);

      expect(response).to.throw;
      expect(response.message).to.equal('Task timed out after 0 minutes');
      expect(stubStatus.callCount).to.equal(5);
      sinon.assert.calledWith(stubStatus, taskGuid);
      sinon.assert.calledOnceWithExactly(stubCancelTask, taskGuid);
    });

    it('should return the state of a SUCCEEDED task', async () => {
      const taskGuid = 'abc123';
      const state = 'SUCCEEDED';
      const statusPending = {
        state: 'PENDING',
      };
      const statusComplete = {
        state,
      };

      const apiClient = new CloudFoundryAPIClient();

      const stubStatus = sinon.stub(apiClient, 'fetchTaskByGuid');
      stubStatus
        .onFirstCall()
        .resolves(statusPending)
        .onSecondCall()
        .resolves(statusPending)
        .onThirdCall()
        .resolves(statusComplete);

      const response = await apiClient.pollTaskStatus(taskGuid, {
        totalAttempts: 5,
        sleepInterval: 0,
      });

      expect(response.state).to.equal(state);
      expect(stubStatus.callCount).to.equal(3);
      sinon.assert.calledWith(stubStatus, taskGuid);
    });

    it('should return the state of a FAILED task', async () => {
      const taskGuid = 'abc123';
      const state = 'FAILED';
      const statusPending = {
        state: 'PENDING',
      };
      const statusComplete = {
        state,
      };

      const apiClient = new CloudFoundryAPIClient();

      const stubStatus = sinon.stub(apiClient, 'fetchTaskByGuid');
      stubStatus
        .onFirstCall()
        .resolves(statusPending)
        .onSecondCall()
        .resolves(statusPending)
        .onThirdCall()
        .resolves(statusComplete);

      const response = await apiClient.pollTaskStatus(taskGuid, {
        totalAttempts: 5,
        sleepInterval: 0,
      });

      expect(response.state).to.equal(state);
      expect(stubStatus.callCount).to.equal(3);
      sinon.assert.calledWith(stubStatus, taskGuid);
    });
  });

  describe('.retry', () => {
    it('should retry fetching until last operation state is succeeded', async () => {
      const name = 'instance-name';
      const method = 'fetchServiceInstances';
      const resource1stCall = factory.createCFAPIResource({
        name,
        last_operation: {
          state: 'initial',
        },
      });
      const resource2ndCall = factory.createCFAPIResource({
        name,
        last_operation: {
          state: 'in progress',
        },
      });
      const resource3rdCall = factory.createCFAPIResource({
        name,
        last_operation: {
          state: 'succeeded',
        },
      });
      const apiClient = new CloudFoundryAPIClient();

      const authRequestStub = sinon.stub(apiClient, method);
      authRequestStub
        .onFirstCall()
        .resolves(resource1stCall)
        .onSecondCall()
        .resolves(resource2ndCall)
        .onThirdCall()
        .resolves(resource3rdCall);

      const response = await apiClient.retry(method, name, {
        sleepInterval: 1,
      });

      sinon.assert.calledThrice(authRequestStub);
      expect(response).to.deep.equal(resource3rdCall);
    });

    it(`should retry fetching up to 5
        times and returns last fetched result`, async () => {
      const name = 'instance-name';
      const totalRetries = 5;
      const method = 'fetchServiceInstances';
      const resource = factory.createCFAPIResource({
        name,
        last_operation: {
          state: 'initial',
        },
      });
      const apiClient = new CloudFoundryAPIClient();

      const authRequestStub = sinon.stub(apiClient, method);
      authRequestStub
        .onCall(0)
        .resolves(resource)
        .onCall(1)
        .resolves(resource)
        .onCall(2)
        .resolves(resource)
        .onCall(3)
        .resolves(resource)
        .onCall(4)
        .resolves(resource);

      const response = await apiClient.retry(method, name, {
        sleepInterval: 1,
        totalRetries,
      });

      sinon.assert.callCount(authRequestStub, 5);
      expect(response).to.deep.equal(resource);
    });
  });
});
