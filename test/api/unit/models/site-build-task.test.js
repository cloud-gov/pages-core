const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const { BuildTask } = require('../../../../api/models');

describe('Build Task model', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('createBuildTask', () => {
    it('should create a build task ', async () => {
      const site = await factory.site();
      const buildTaskType = await factory.buildTaskType();
      const siteBuildTask = await factory.siteBuildTask({
        siteId: site.id,
        buildTaskTypeId: buildTaskType.id,
      });
      const build = await factory.build({
        site: site.id,
        branch: 'main',
      });

      const createdBuildTask = await siteBuildTask.createBuildTask(build);
      expect(createdBuildTask).to.have.property('status', BuildTask.Statuses.Created);
      expect(createdBuildTask).to.have.property('buildTaskTypeId', buildTaskType.id);
      expect(createdBuildTask).to.have.property('buildId', build.id);
    });
    it('should fail to create a build task for invalid build', async () => {
      const site = await factory.site();
      const buildTaskType = await factory.buildTaskType();
      const siteBuildTask = await factory.siteBuildTask({
        siteId: site.id,
        buildTaskTypeId: buildTaskType.id,
      });
      const build = await factory.build({
        site: site.id,
        branch: 'main 1',
        state: 'invalid',
      });

      await expect(siteBuildTask.createBuildTask(build)).to.be.rejectedWith(
        'Can not create build task for invalid build.',
      );
    });
  });
});

describe('Site Build Task model', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('create', () => {
    it('should fail if branch name is invalid', async () => {
      const site = await factory.site();
      const buildTaskType = await factory.buildTaskType();

      await expect(
        factory.siteBuildTask({
          siteId: site.id,
          buildTaskTypeId: buildTaskType.id,
          branch: 'main 1',
        }),
      ).to.be.rejectedWith(
        'Validation error: ' +
          'Invalid branch name — ' +
          'branches can only contain alphanumeric characters, underscores, and hyphens.',
      );
    });
  });
});
