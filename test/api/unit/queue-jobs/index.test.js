const { expect } = require('chai');
const { QueueEvents } = require('bullmq');
const {
  BuildTasksQueueName,
  SiteBuildsQueueName,
} = require('../../../../api/queues');
const QueueJobs = require('../../../../api/queue-jobs');
const { Build, BuildTask, Site } = require('../../../../api/models');
const factory = require('../../support/factory');
const { connection } = require('../../support/queues');

async function cleanDb() {
  return Promise.all([
    Build.truncate(),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

const queue = new QueueJobs(connection);

describe('QueueJobs', () => {
  describe('.startSiteBuild', () => {
    const queueEvents = new QueueEvents(SiteBuildsQueueName, { connection });

    after(async () => {
      await queueEvents.close();
      await queue.siteBuildsQueue.close();
    });

    afterEach(async () => {
      await queue.siteBuildsQueue.obliterate({ force: true });
      await cleanDb();
    });

    it('should start a site build successfully', async () => {
      const factoryBuild = await factory.build();
      const build = await Build.findByPk(factoryBuild.id, { include: [Site] });
      const jobname = `${build.Site.owner}/${build.Site.repository}: ${build.branch}`;

      const response = await queue.startSiteBuild(build);
      expect(response.name).to.eq(jobname);
    });

    it('should start a site build successfully and truncate long branch name', async () => {
      const branch = Array(100).fill('b').join('');
      const factoryBuild = await factory.build({ branch });
      const build = await Build.findByPk(factoryBuild.id, { include: [Site] });
      const jobname = `${build.Site.owner}/${
        build.Site.repository
      }: ${build.branch.substring(0, 30)}...`;

      const response = await queue.startSiteBuild(build);
      expect(response.name).to.eq(jobname);
    });
  });

  describe('.startBuildTask', () => {
    const queueEvents = new QueueEvents(BuildTasksQueueName, { connection });

    after(async () => {
      await queueEvents.close();
      await queue.buildTasksQueue.close();
    });

    afterEach(async () => {
      await cleanDb();
    });

    it('should start a site build successfully', async () => {
      const buildTask = await factory.buildTask();
      const setupTaskEnvBuildTask = await BuildTask.forRunner().findByPk(
        buildTask.id
      );
      const jobname = setupTaskEnvBuildTask.BuildTaskType.name;

      const response = await queue.startBuildTask(setupTaskEnvBuildTask);
      expect(response.name).to.eq(jobname);
    });
  });
});
