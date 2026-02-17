const { expect } = require('chai');
const factory = require('../../support/factory');

const { Build } = require('../../../../api/models');
const BuildLogs = require('../../../../api/services/build-logs/build-logs');
const { BuildService } = require('../../../../api/services/build');

describe('Build service', () => {
  it('creates log for invalid build', async () => {
    const branchName = 'invalid branch name';
    const site = await factory.site();
    const user = await factory.user();
    const invalidBuild = await Build.create({
      user: user.id,
      username: user.username,
      site: site.id,
      branch: branchName,
    });

    invalidBuild.reload();

    await BuildService.enqueueOrLogBuild(invalidBuild);

    const { logs: logStr } = await BuildLogs.fetchBuildLogs(invalidBuild);

    expect(logStr).to.equal(
      'Invalid branch name — ' +
        'branches can only contain alphanumeric characters, underscores, and hyphens.',
    );
    expect(logStr.split('\n').length).to.equal(1);
  });
});
