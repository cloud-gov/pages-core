const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const {
  Build,
  Site,
  SiteBranchConfig,
  User,
} = require('../../../../api/models');
const NightlyBuildsHelper = require('../../../../api/services/NightlyBuildsHelper');
const SiteBuildQueue = require('../../../../api/services/SiteBuildQueue');

describe('NightlyBuildsHelper', () => {
  const nightlyConfig = { schedule: 'nightly' };

  before(async () => {
    sinon.stub(SiteBuildQueue, 'sendBuildMessage').resolves();
    await factory.user({ username: process.env.USER_AUDITOR });
  });

  beforeEach(async () => {
    await Promise.all([
      Build.truncate(),
      Site.truncate(),
      SiteBranchConfig.truncate(),
    ]);
  });

  afterEach(async () => {
    sinon.restore();
    await Promise.all([
      Build.truncate(),
      Site.truncate(),
      SiteBranchConfig.truncate(),
    ]);
  });

  after(async () => {
    await User.truncate({ force: true, cascade: true });
  });

  describe('when there is an error', () => {
    it('does not reject and reports failure', async () => {
      const stub = sinon.stub(Build, 'create');
      const error = new Error('YARGH');
      stub.throws(error);

      await factory.site({
        owner: 'foo',
        repository: 'test',
        defaultConfig: nightlyConfig,
        defaultBranch: 'main',
      });

      const result = await NightlyBuildsHelper.nightlyBuilds();

      expect(result.length).to.eq(1);
      expect(result[0].status).to.eq('rejected');
      expect(result[0].reason).to.be.an('error');
    });
  });

  it('it should remove sites without push from user and site w/o repo and report', async () => {
    const sites = await Promise.all([
      factory.site({
        owner: 'scheduled',
        repository: 'test1',
        defaultConfig: nightlyConfig,
        defaultBranch: 'main',
        demoConfig: nightlyConfig,
        demoBranch: 'staging',
      }),
      factory.site({
        owner: 'scheduled',
        repository: 'test2',
        demoBranch: 'staging',
        demoConfig: nightlyConfig,
      }),
      factory.site({
        owner: 'scheduled',
        repository: 'test3',
        demoConfig: nightlyConfig,
      }),
      factory.site({
        owner: 'not-scheduled',
        repository: 'test4',
      }),
    ]);

    const results = await NightlyBuildsHelper.nightlyBuilds();

    expect(results.length).to.eql(3);
    expect(results).to.deep.include({
      status: 'fulfilled',
      value: `site:${sites[0].id}@main`,
    });
    expect(results).to.deep.include({
      status: 'fulfilled',
      value: `site:${sites[0].id}@staging`,
    });
    expect(results).to.deep.include({
      status: 'fulfilled',
      value: `site:${sites[1].id}@staging`,
    });

    const builds = await Build.findAll({
      where: { site: sites.map((site) => site.id) },
    });

    expect(builds.length).to.eql(3);
    expect(builds.filter((build) => build.branch === 'main').length).to.eql(1);
    expect(builds.filter((build) => build.branch === 'staging').length).to.eql(
      2
    );
  });
});
