const { expect } = require('chai');
const sinon = require('sinon');
const { QueueEvents, Queue } = require('bullmq');
const QueueWorker = require('../../../../api/workers/QueueWorker');
const {
  Build,
  BuildTask,
  Domain,
  Site,
  SiteBranchConfig,
  User,
} = require('../../../../api/models');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');
const {
  SiteBuildsQueue,
  SiteBuildsQueueName,
} = require('../../../../api/queues');
const jobProcessors = require('../../../../api/workers/jobProcessors');
const SiteBuildQueueService = require('../../../../api/services/SiteBuildQueue');
const factory = require('../../support/factory');
const { promisedQueueEvents } = require('../../support/queues');
const { createQueueConnection } = require('../../../../api/utils/queues');

const buildIncludeOptions = {
  include: [
    {
      model: Site,
      required: true,
      include: [SiteBranchConfig, Domain],
    },
    User,
  ],
};

const taskMessage = buildId => ({
  environment: [
    {
      name: 'STATUS_CALLBACK',
      value: `http://localhost:1337/v0/build/${buildId}/status/abcd-123`,
    },
    { name: 'BRANCH', value: 'test-branch' },
    { name: 'BUILD_ID', value: buildId },
    { name: 'BUCKET', value: 'cg-123456789' },
  ],
  containerName: undefined,
  containerSize: undefined,
});

const testJobOptions = { sleepNumber: 0, totalAttempts: 240 };

async function cleanDb() {
  return Promise.all([
    BuildTask.truncate(),
    Build.truncate(),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

describe('siteBuildRunner', () => {
  after(async () => {
    await cleanDb();
  });

  describe('Expected Worker Output', () => {
    const connection = createQueueConnection();
    const queueName = 'test-site-build-queue';
    // eslint-disable-next-line no-unused-vars
    const worker = new QueueWorker(
      queueName,
      connection,
      job => jobProcessors.siteBuildRunner(job, testJobOptions)
    );
    const queue = new Queue(queueName, {
      connection,
      defaultJobOptions: { attempts: 1 },
    });

    // Set the queue to only attempt jobs once for testing
    // const queue = new SiteBuildsQueue(connection);
    const queueEvents = new QueueEvents(queueName, { connection });

    afterEach(async () => {
      await queue.obliterate({ force: true });
      await cleanDb();
      await sinon.restore();
    });

    it('should fail the job when unable to setupTaskEnv', async () => {
      const errorResponse = new Error('It errored');
      const build = await factory.build();
      const stubBuildFindByPk = sinon.stub(Build, 'findByPk').resolves(build);
      const stubSiteBuildQueueService = sinon
        .stub(SiteBuildQueueService, 'setupTaskEnv')
        .rejects(errorResponse);
      const job = await queue.add('message', { buildId: build.id });
      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Error site build ${build.id}: ${errorResponse.message}`;

      await build.reload();

      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
      expect(build.state).to.equal(Build.States.Error);
      sinon.assert.calledOnceWithExactly(stubBuildFindByPk, build.id);
      sinon.assert.calledOnceWithExactly(stubSiteBuildQueueService, build.id);
    });

    it('should fail the job when CF task call fails', async () => {
      const cfTaskError = new Error('Unable to connect');
      const stubTaskEnv = sinon.stub(SiteBuildQueue, 'setupTaskEnv');
      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startSiteBuildTask')
        .rejects(cfTaskError);

      const factoryBuild = await factory.build();
      const build = await Build.findByPk(factoryBuild.id, buildIncludeOptions);
      const message = taskMessage(build.id);
      stubTaskEnv.resolves({ build, message });
      const job = await queue.add('message', { buildId: build.id });
      expect(build.state).to.equal(Build.States.Created);

      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Error site build ${build.id}: ${cfTaskError.message}`;
      await build.reload();

      expect(build.state).to.equal(Build.States.Error);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
    });

    it('should fail the job and build when CF tasks status goes beyond the max number of attempts', async () => {
      const guid = 'task-guid';
      const taskState = 'PENDING';

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startSiteBuildTask')
        .resolves({ guid, state: taskState });

      const fb = await factory.build();
      const build = await Build.findByPk(fb.id, buildIncludeOptions);
      const message = taskMessage(build.id);
      sinon.stub(SiteBuildQueue, 'setupTaskEnv')
        .resolves({ build, message });
      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskByGuid');
      stubStatus.resolves({ state: taskState });

      const stubCancelTask = sinon.stub(CloudFoundryAPIClient.prototype, 'cancelTask');
      stubCancelTask.resolves();

      expect(build.state).to.equal(Build.States.Created);

      const job = await queue.add('message', { buildId: build.id });
      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Error site build ${build.id}: Task timed out after 0 minutes`;
      await build.reload();

      expect(build.state).to.equal(Build.States.Error);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
      // Default number of attempts to poll status. Every 15 seconds for an hour.
      expect(stubStatus.callCount).to.equal(240);
      sinon.assert.calledWith(stubStatus, guid);
      sinon.assert.calledOnceWithExactly(stubCancelTask, guid);
    });

    it('should have a successfull build', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';

      const stubStartSiteBuildTask = sinon
        .stub(CloudFoundryAPIClient.prototype, 'startSiteBuildTask');
      stubStartSiteBuildTask.resolves({ guid, state: taskState });

      const fb = await factory.build();
      const build = await Build.findByPk(fb.id, buildIncludeOptions);
      const message = taskMessage(build.id);
      const stubSetupTaskEnv = sinon.stub(SiteBuildQueue, 'setupTaskEnv');
      stubSetupTaskEnv.resolves({ build, message });

      const stubTaskStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskByGuid');
      stubTaskStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildId: build.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledOnceWithExactly(
        stubStartSiteBuildTask,
        message,
        job.id,
        { sleepInterval: 0 }
      );
      sinon.assert.calledOnceWithExactly(stubSetupTaskEnv, build.id);
      sinon.assert.calledWith(stubTaskStatus, guid);
    });

    it('should verify or set build state error if CF Task fails', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';
      const taskFinishedState = 'FAILED';

      const stubStartSiteBuildTask = sinon
        .stub(CloudFoundryAPIClient.prototype, 'startSiteBuildTask');
      stubStartSiteBuildTask.resolves({ guid, state: taskState });

      const fb = await factory.build();
      const build = await Build.findByPk(fb.id, buildIncludeOptions);
      const message = taskMessage(build.id);
      const stubSetupTaskEnv = sinon.stub(SiteBuildQueue, 'setupTaskEnv');
      stubSetupTaskEnv.resolves({ build, message });

      const stubTaskStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskByGuid');
      stubTaskStatus.resolves({ state: taskFinishedState });

      expect(build.state).to.equal(Build.States.Created);

      const job = await queue.add('sendTaskMessage', { buildId: build.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');

      await build.reload();

      expect(build.state).to.equal(Build.States.Error);
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledOnceWithExactly(
        stubStartSiteBuildTask,
        message,
        job.id,
        { sleepInterval: 0 }
      );
      sinon.assert.calledOnceWithExactly(stubSetupTaskEnv, build.id);
      sinon.assert.calledWith(stubTaskStatus, guid);
    });

    it('should have a successfull build with a retry on creating CF Task', async () => {
      const guid = 'task-guid';
      const startTaskResponse = { guid, state: 'PENDING' };
      const taskState = 'SUCCEEDED';

      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskAppGUID')
        .resolves('123');

      const cfTaskStub = sinon
        .stub(CloudFoundryAPIClient.prototype, 'authRequest');

      cfTaskStub.onFirstCall()
        .rejects()
        .onSecondCall()
        .rejects()
        .onThirdCall()
        .resolves(startTaskResponse);

      const fb = await factory.build();
      const build = await Build.findByPk(fb.id, buildIncludeOptions);
      const message = taskMessage(build.id);
      const stubSetupTaskEnv = sinon.stub(SiteBuildQueue, 'setupTaskEnv');
      stubSetupTaskEnv.resolves({ build, message });

      const stubTaskStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskByGuid');
      stubTaskStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildId: build.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);
      expect(cfTaskStub.callCount).to.equal(3);
      sinon.assert.calledOnceWithExactly(stubSetupTaskEnv, build.id);
      sinon.assert.calledWith(stubTaskStatus, guid);
    });
  });
});
