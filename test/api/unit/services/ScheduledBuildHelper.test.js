const expect = require('chai').expect;
const yaml = require('js-yaml');
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
      config = { schedule: 'nightly' };
      factory.site({
        config: yaml.safeDump(config),
        defaultBranch: 'master',
        demoConfig: yaml.safeDump(config),
        demoBranch: 'staging',
      })
      .then(() => factory.site({
        config: yaml.safeDump(config),
        demoConfig: yaml.safeDump(config),
      }))
      .then(() => Site.count())
      .then(count => {
        expect(count).to.eql(2);
      })
      .then(() => ScheduledBuildHelper.nightlyBuilds())
      .then(() => Build.findAll())
      .then((builds) => {
        expect(builds.length).to.eql(2);
        expect(builds.filter(build => build.branch === 'master').length).to.eql(1);
        expect(builds.filter(build => build.branch === 'staging').length).to.eql(1);
        expect(builds[0].site).to.eql(builds[1].site);
        done();
      })
      .catch(done);
    });
  });
});
