const sinon = require('sinon');
const moment = require('moment');
const { Build, BuildTask, Site, SiteBuildTask } = require('../../../../api/models');

const jobProcessors = require('../../../../api/workers/jobProcessors');
const factory = require('../../support/factory');

async function cleanDb() {
  return Promise.all([
    BuildTask.truncate(),
    Build.truncate(),
    SiteBuildTask.truncate(),
    Site.truncate({
      force: true,
      cascade: true,
    }),
  ]);
}

describe('buildTaskScheduler', () => {
  after(async () => {
    await cleanDb();
  });

  describe('Expected Worker Output', () => {
    afterEach(async () => {
      await cleanDb();
      await sinon.restore();
    });

    it('should queue build tasks on this day of the month', async () => {
      const stub = sinon.stub(BuildTask.prototype, 'enqueue');

      const site = await factory.site();
      const buildTaskType = await factory.buildTaskType();
      await factory.siteBuildTask({
        siteId: site.id,
        buildTaskTypeId: buildTaskType.id,
        metadata: {
          runDay: moment().date(),
        },
        branch: 'main',
      });
      await factory.build({
        site: site.id,
        branch: 'main',
      });

      // this one shouldn't run
      const site2 = await factory.site();
      await factory.siteBuildTask({
        siteId: site2.id,
        buildTaskTypeId: buildTaskType.id,
        metadata: {
          runDay: moment().add(2, 'days').date(),
        },
        branch: 'main',
      });
      await factory.build({
        site: site2.id,
        branch: 'main',
      });

      await jobProcessors.buildTasksScheduler({ log: () => {} });
      sinon.assert.calledOnce(stub);
    });
  });
});
