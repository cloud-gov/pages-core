const { expect } = require('chai');
const sinon = require('sinon');
const { Queue, QueueEvents } = require('bullmq');
const QueueWorker = require('../../../../api/workers/QueueWorker');
const {
  Build,
  BuildTask,
  Site,
} = require('../../../../api/models');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const {
  BuildTasksQueue,
  BuildTasksQueueName,
} = require('../../../../api/queues');
const BuildTaskQueue = require('../../../../api/services/BuildTaskQueue');
const jobProcessors = require('../../../../api/workers/jobProcessors');
const { wait } = require('../../../../api/utils');
const factory = require('../../support/factory');
const { promisedQueueEvents } = require('../../support/queues');
const { createQueueConnection } = require('../../../../api/utils/queues');

const testJobOptions = { sleepNumber: 0, totalAttempts: 240 };

async function cleanDb() {
  return Promise.all([
    BuildTask.truncate(),
    Build.truncate(),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

describe('buildTaskRunner', () => {
  after(async () => {
    await cleanDb();
  });

  describe('Expected Worker Output', () => {
    const connection = createQueueConnection();
    // eslint-disable-next-line no-unused-vars
    const worker = new QueueWorker(
      BuildTasksQueueName,
      connection,
      job => jobProcessors.buildTaskRunner(job, testJobOptions)
    );

    // Set the queue to only attempt jobs once for testing
    const queue = new BuildTasksQueue(connection, { attempts: 1 });
    const queueEvents = new QueueEvents(BuildTasksQueueName, { connection });

    afterEach(async () => {
      await queue.obliterate({ force: true });
      await cleanDb();
      await sinon.restore();
    });

    it('should fail the job with no task record', async () => {
      sinon.stub(BuildTask, 'findByPk').rejects();
      sinon.stub(BuildTaskQueue, 'setupTaskEnv').rejects();
      const job = await queue.add('sendTaskMessage', {});
      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = 'Error';

      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
    });

    it('should fail the job when CF task call fails', async () => {
      const cfTaskError = 'Unable to connect';
      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask')
        .rejects(cfTaskError);

      const task = await factory.buildTask();
      const setupTaskEnvBuildTask = await BuildTask.forRunner().findByPk(
        task.id
      );
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: setupTaskEnvBuildTask, data: {} });
      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      expect(task.status).to.equal(BuildTask.Statuses.Created);

      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Error build task cf_task ${task.id}: ${cfTaskError}`;
      await task.reload();

      expect(task.status).to.equal(BuildTask.Statuses.Error);
      expect(task.message).to.equal(expectedReason);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
    });

    it('should fail the job when 3 CF task calls fail', async () => {
      const cfTaskError = 'Unable to connect';
      sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskAppGUID')
        .resolves('123');

      const cfTaskStub = sinon
        .stub(CloudFoundryAPIClient.prototype, 'authRequest');

      cfTaskStub
        .rejects(cfTaskError);

      const task = await factory.buildTask();
      const setupTaskEnvBuildTask = await BuildTask.forRunner().findByPk(
        task.id
      );
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: setupTaskEnvBuildTask, data: {} });
      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id, data: {} });

      expect(task.status).to.equal(BuildTask.Statuses.Created);

      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Error build task cf_task ${task.id}: ${cfTaskError}`;
      await task.reload();

      expect(task.status).to.equal(BuildTask.Statuses.Error);
      expect(cfTaskStub.callCount).to.equal(3);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
    });

    it('should fail the job when build task in unknown task runner', async () => {
      const runner = 'unknown-runner';
      const task = await factory.buildTask();
      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      const taskWithUnknownRunner = { ...taskWithIncludes, BuildTaskType: { runner } };
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithUnknownRunner, data: {} });

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id, data: {} });

      expect(task.status).to.equal(BuildTask.Statuses.Created);

      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = `Unknown task runner ${task.id}: ${runner}`;
      await task.reload();

      expect(task.status).to.equal(BuildTask.Statuses.Error);
      expect(task.message).to.equal(expectedReason);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
    });

    it('should fail the job and task when build task goes beyond the max number of attempts', async () => {
      const guid = 'task-guid';
      const taskState = 'PENDING';

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask')
        .resolves({ guid, state: 'PENDING', result: 'Good' });

      const task = await factory.buildTask();
      const setupTaskEnvBuildTask = await BuildTask.forRunner().findByPk(
        task.id
      );
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: setupTaskEnvBuildTask, data: {} });
      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'fetchTaskByGuid');
      stubStatus.resolves({ state: taskState });

      const stubCancelTask = sinon.stub(CloudFoundryAPIClient.prototype, 'cancelTask');
      stubCancelTask.resolves();

      expect(task.status).to.equal(BuildTask.Statuses.Created);

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      const result = await promisedQueueEvents(queueEvents, 'failed');
      const expectedReason = 'Task timed out after 0 minutes';
      await task.reload();

      expect(task.status).to.equal(BuildTask.Statuses.Error);
      expect(task.message).to.equal(expectedReason);
      expect(result.jobId).to.equal(job.id);
      expect(result.failedReason).to.equal(expectedReason);
      // Default number of attempts to poll status. Every 15 seconds for an hour.
      expect(stubStatus.callCount).to.equal(240);
      sinon.assert.calledWith(stubStatus, guid);
      sinon.assert.calledOnceWithExactly(stubCancelTask, guid);
    });

    it('should have a successfull CF task type', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask')
        .resolves({ guid, state: 'PENDING', result: 'Good' });

      const task = await factory.buildTask();
      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithIncludes, data: {} });

      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'pollTaskStatus');
      stubStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledWith(stubStatus, guid);
    });

    it('should have a successfull CF task with a custom domains', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';
      const jobData = { data: {} };

      const stubStartBuildTask = sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask');

      stubStartBuildTask.resolves({ guid, state: 'PENDING' });

      const site = await factory.site();
      const siteBranchConfig = site.SiteBranchConfigs[0];
      const build = await factory.build({ site: site.id, branch: siteBranchConfig.branch });
      const task = await factory.buildTask({ build });
      const domain = await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: siteBranchConfig.id,
        state: 'provisioned',
      });
      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      const rawTask = taskWithIncludes.get({ plain: true });
      rawTask.Build.url = `https://${domain.names.split(',')[0]}`;
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithIncludes, ...jobData });

      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'pollTaskStatus');
      stubStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledWith(stubStartBuildTask, rawTask, jobData);
      sinon.assert.calledWith(stubStatus, guid);
    });

    it('should have a successfull CF task with a custom rules', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';
      const jobData = { data: {} };

      const stubStartBuildTask = sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask');

      stubStartBuildTask.resolves({ guid, state: 'PENDING' });

      const site = await factory.site();
      const build = await factory.build({ site: site.id });
      const siteBuildTask = await factory.siteBuildTask({
        siteId: site.id,
        metadata: { rules: ['a custom scan rule'] },
      });
      const task = await factory.buildTask({ build, siteBuildTaskId: siteBuildTask.id });

      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      const rawTask = taskWithIncludes.get({ plain: true });

      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithIncludes, ...jobData });

      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'pollTaskStatus');
      stubStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledWith(stubStartBuildTask, rawTask, jobData);
      sinon.assert.calledWith(stubStatus, guid);
    });

    it('should have a successfull CF task type with multiple startBuildTask calls', async () => {
      const guid = 'task-guid';
      const taskState = 'SUCCEEDED';
      const startTaskResponse = { guid, state: 'PENDING', result: 'Good' };

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

      const task = await factory.buildTask();
      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithIncludes, data: {} });

      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'pollTaskStatus');
      stubStatus.resolves({ state: taskState });

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      const result = await promisedQueueEvents(queueEvents, 'completed');
      expect(cfTaskStub.callCount).to.equal(3);
      expect(result.jobId).to.equal(job.id);
      sinon.assert.calledWith(stubStatus, guid);
    });

    it('should have a failed CF task that cleans up build task status', async () => {
      const guid = 'task-guid';
      const stateSucceeded = { state: 'FAILED' };

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'startBuildTask')
        .resolves({ guid, state: 'PENDING', result: 'Good' });

      const task = await factory.buildTask();
      const taskWithIncludes = await BuildTask.forRunner().findByPk(task.id);
      sinon
        .stub(BuildTaskQueue, 'setupTaskEnv')
        .resolves({ buildTask: taskWithIncludes, data: {} });

      const stubStatus = sinon.stub(CloudFoundryAPIClient.prototype, 'pollTaskStatus');
      stubStatus
        .onFirstCall()
        .resolves(stateSucceeded);

      const job = await queue.add('sendTaskMessage', { buildTaskId: task.id });
      expect(task.status).to.equal(BuildTask.Statuses.Created);
      const result = await promisedQueueEvents(queueEvents, 'completed');
      await task.reload();
      expect(result.jobId).to.equal(job.id);
      expect(task.status).to.equal(BuildTask.Statuses.Error);
      sinon.assert.calledWith(stubStatus, guid);
    });
  });

  describe('Expected Worker Concurrency', () => {
    const connection = createQueueConnection();

    context('Use default concurrency of 5', () => {
      const queueName = 'test-concurrency-5-queue';
      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: { attempts: 1 },
      });

      const worker = new QueueWorker(
        queueName,
        connection,
        job => jobProcessors.buildTaskRunner(job, testJobOptions),
        { concurrency: 5 }
      );

      after(async () => {
        await worker.close();
        await queue.close();
      });

      afterEach(async () => {
        await queue.obliterate({ force: true });
        await sinon.restore();
      });

      it('should max to 5 concurrent jobs', async () => {
        // Stub out the initial BuildTask.findByPk query with sleep to simulate long job processes
        sinon.stub(BuildTask, 'findByPk').callsFake(() => wait(2000));
        const jobs = Array(10).fill({ name: 'sendTaskMessage', data: {} });
        await queue.addBulk(jobs);

        // Let the jobs fill in
        await wait(1000);

        // Get the active count
        const active = await queue.getActiveCount();
        const waiting = await queue.getWaitingCount();
        expect(active).to.equal(5);
        expect(waiting).to.equal(5);
      });
    });

    context('Set concurrency to 1', () => {
      const queueName = 'test-concurrency-1-queue';
      const worker = new QueueWorker(
        queueName,
        connection,
        job => jobProcessors.buildTaskRunner(job, testJobOptions),
        { concurrency: 1 }
      );

      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: { attempts: 1 },
      });

      after(async () => {
        await worker.close();
        await queue.close();
      });

      afterEach(async () => {
        await queue.obliterate({ force: true });
        await sinon.restore();
      });

      it('should max to 1 concurrent jobs', async () => {
        // Stub out the initial BuildTask.findByPk query with sleep to simulate long job processes
        sinon.stub(BuildTask, 'findByPk').callsFake(() => wait(2000));
        const jobs = Array(5).fill({ name: 'sendTaskMessage', data: {} });
        await queue.addBulk(jobs);

        // Let the jobs fill in
        await wait(1000);

        // Get the active count
        const active = await queue.getActiveCount();
        const waiting = await queue.getWaitingCount();
        expect(active).to.equal(1);
        expect(waiting).to.equal(4);
      });
    });
  });
});
