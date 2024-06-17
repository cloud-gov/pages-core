const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const { SiteBuildTask, BuildTask } = require('../../../../api/models');

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
  });
});
