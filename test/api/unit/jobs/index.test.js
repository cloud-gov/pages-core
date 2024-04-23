const { expect } = require('chai');
const { QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { startSiteBuild } = require('../../../../api/queue-jobs');
const {
  SiteBuildsQueue,
  SiteBuildsQueueName,
} = require('../../../../api/queues');
const {
  Build,
  Site,
} = require('../../../../api/models');
const { redis: redisConfig } = require('../../../../config');
const factory = require('../../support/factory');
const { promisedQueueEvents, promisedQueueAnyEvents } = require('../../support/queues');

const connection = new IORedis(redisConfig.url, {
  tls: redisConfig.tls,
  maxRetriesPerRequest: null,
});

async function cleanDb() {
  return Promise.all([
    Build.truncate(),
    Site.truncate({ force: true, cascade: true }),
  ]);
}

describe('queue-jobs', () => {
  describe('.startSiteBuild', () => {
    const queue = new SiteBuildsQueue(connection);
    const queueEvents = new QueueEvents(SiteBuildsQueueName, { connection });

    after(async () => {
      await queueEvents.close();
      await queue.close();
    });

    afterEach(async () => {
      await queue.obliterate({ force: true });
      await cleanDb();
    });

    it('should start a site build successfully', async () => {
      const factoryBuild = await factory.build();
      const build = await Build.findByPk(factoryBuild.id, { include: [Site] });
      const jobname = `${build.Site.owner}/${build.Site.repository}: ${build.branch}`;

      const response = await startSiteBuild(build);
      const job = await promisedQueueEvents(queueEvents, 'active');
      expect(response.id).to.eq(job.jobId);
      expect(response.name).to.eq(jobname);
    });

    it('should start a site build successfully and truncat long branch name', async () => {
      const branch = Array(100).fill('b').join('');
      const factoryBuild = await factory.build({ branch });
      const build = await Build.findByPk(factoryBuild.id, { include: [Site] });
      const jobname = `${build.Site.owner}/${build.Site.repository}: ${build.branch.substring(0, 30)}...`;

      const response = await startSiteBuild(build);
      const job = await promisedQueueAnyEvents(queueEvents, ['active', 'waiting']);
      expect(response.id).to.eq(job.jobId);
      expect(response.name).to.eq(jobname);
    });
  });
});
