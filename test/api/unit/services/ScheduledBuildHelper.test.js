const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const { Build, Site, User } = require('../../../../api/models');
const ScheduledBuildHelper = require('../../../../api/services/ScheduledBuildHelper');
const SQS = require('../../../../api/services/SQS');

describe('ScheduledBuildHelper', () => {
  const nightlyConfig = { schedule: 'nightly' };

  before(async () => {
    sinon.stub(SQS, 'sendBuildMessage').resolves();
    await factory.user({ username: process.env.USER_AUDITOR });
  });

  afterEach(async () => {
    sinon.restore();
    await Promise.all([
      Build.truncate(),
      Site.truncate(),
      User.truncate({ force: true }),
    ]);
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

      const result = await ScheduledBuildHelper.nightlyBuilds();

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

    const result = await ScheduledBuildHelper.nightlyBuilds();

    expect(result).to.have.deep.members([
      { status: 'fulfilled', value: 'scheduled/test1@main' },
      { status: 'fulfilled', value: 'scheduled/test1@staging' },
      { status: 'fulfilled', value: 'scheduled/test2@staging' },
    ]);

    const builds = await Build.findAll({ where: { site: sites.map(site => site.id) } });

    expect(builds.length).to.eql(3);
    expect(builds.filter(build => build.branch === 'main').length).to.eql(1);
    expect(builds.filter(build => build.branch === 'staging').length).to.eql(2);
  });
});
