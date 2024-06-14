const sinon = require('sinon');
const moment = require('moment');
const QueueWorker = require('../../../../api/workers/QueueWorker');
const {
  Build,
  BuildTask,
  Site,
  SiteBuildTask,
} = require('../../../../api/models');
const {
  ScheduledQueue,
  ScheduledQueueName,
} = require('../../../../api/queues');
const jobProcessors = require('../../../../api/workers/jobProcessors');
const factory = require('../../support/factory');
const { createQueueConnection } = require('../../../../api/utils/queues');

const testJobOptions = { sleepNumber: 0, totalAttempts: 240 };

async function cleanDb() {
  return Promise.all([
    BuildTask.truncate(),
    Build.truncate(),
    SiteBuildTask.truncate(),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

describe('buildTaskScheduler', () => {
  after(async () => {
    await cleanDb();
  });

  describe('Expected Worker Output', () => {
    const connection = createQueueConnection();
    // eslint-disable-next-line no-unused-vars
    const worker = new QueueWorker(
      ScheduledQueueName,
      connection,
      job => jobProcessors.buildTasksScheduler(job, testJobOptions)
    );

    // Set the queue to only attempt jobs once for testing
    const queue = new ScheduledQueue(connection, { attempts: 1 });

    afterEach(async () => {
      await queue.obliterate({ force: true });
      await cleanDb();
      await sinon.restore();
    });

    it('should queue build tasks on this day of the month', async () => {
      const stub = sinon.stub(SiteBuildTask.prototype, 'createBuildTask');

      const site = await factory.site();
      const buildTaskType = await factory.buildTaskType();
      await factory.siteBuildTask({
        siteId: site.id,
        buildTaskTypeId: buildTaskType.id,
        metadata: { runDay: moment().date() },
        branch: 'main',
      });
      await factory.build({
        site: site.id,
        branch: 'main',
      });

      await queue.add('buildTasksScheduler', {});
      sinon.assert.calledOnce(stub);
    });
  });
});
