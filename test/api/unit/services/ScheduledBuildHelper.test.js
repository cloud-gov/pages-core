const expect = require('chai').expect;
const factory = require('../../support/factory');
const { Build, Site } = require('../../../../api/models');
const ScheduledBuildHelper = require('../../../../api/services/ScheduledBuildHelper');


describe('ScheduledBuildHelper', () => {
  before(() => {
    factory.user({ username: process.env.USER_AUDITOR })
      .catch();
  });

  context('nightlyBuilds', () => {
    it('it should remove sites without push from user and site w/o repo', (done) => {
      let sites;
      const config = { schedule: 'nightly' };
      factory.site({
        owner: 'scheduled',
        defaultConfig: config,
        defaultBranch: 'master',
        demoConfig: config,
        demoBranch: 'staging',
      })
      .then(() => factory.site({
        owner: 'scheduled',
        demoBranch: 'staging',
        demoConfig: config,
      }))
      .then(() => factory.site({
        owner: 'scheduled',
        demoConfig: config,
      }))
      .then(() => factory.site({
        owner: 'scheduled',
      }))
      .then(() => Site.findAll({ where: { owner: 'scheduled' } }))
      .then((_sites) => {
        sites = _sites;
        expect(sites.length).to.eql(4);
        return ScheduledBuildHelper.nightlyBuilds();
      })
      .then(() => Build.findAll({ where: { site: sites.map(site => site.id) } }))
      .then((builds) => {
        expect(builds.length).to.eql(3);
        expect(builds.filter(build => build.branch === 'master').length).to.eql(1);
        expect(builds.filter(build => build.branch === 'staging').length).to.eql(2);
        done();
      })
      .catch(done);
    });
  });
});
