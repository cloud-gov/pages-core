const expect = require('chai').expect;
const { Domain, Site, SiteBranchConfig } = require('../../../../api/models');
const { buildViewLink, buildUrl } = require('../../../../api/utils/build');
const factory = require('../../support/factory');
const config = require('../../../../config');

const { proxyDomain } = config.app;

describe('build utils', () => {
  describe('buildUrl', () => {
    let site;
    before(async () => {
      const { id } = await factory.site({
        defaultBranch: 'main',
        demoBranch: 'staging',
      });
      site = await Site.findByPk(id, { include: [SiteBranchConfig, Domain] });
    });

    it('default branch url start with site', async () => {
      let build = await factory.build({ branch: site.defaultBranch, site });
      const url = [
        `https://${site.awsBucketName}.${proxyDomain}`,
        `/site/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('demo branch url start with demo', async () => {
      const build = await factory.build({ branch: site.demoBranch, site });
      const url = [
        `https://${site.awsBucketName}.${proxyDomain}`,
        `/demo/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('non-default/demo branch url start with preview', async () => {
      const build = await factory.build({ branch: 'other', site });
      const url = [
        `https://${site.awsBucketName}.${proxyDomain}`,
        `/preview/${site.owner}/${site.repository}/other`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });
  });

  describe('buildUrl with other site branch context and s3Key', () => {
    let site;
    const branch = 'other-branch';
    const context = 'other';
    const s3Key = 'test/other';

    before(async () => {
      const interimSite = await factory.site({}, { noSiteBranchConfig: true });
      await SiteBranchConfig.create({
        siteId: interimSite.id,
        context,
        branch,
        s3Key,
      });
      site = await Site.findByPk(interimSite.id, {
        include: [SiteBranchConfig],
      });
    });

    it('branch url to have other s3Key', async () => {
      let build = await factory.build({ branch, site });
      const url = [
        `https://${site.awsBucketName}.${proxyDomain}`,
        `/${s3Key}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });
  });

  describe('viewLink', () => {
    let site;
    const defaultBranch = 'main';
    const demoBranch = 'demo';
    const domain = 'https://www.main.com/'; // test ending slash formatting
    const demoDomain = 'https://www.demo.com';

    beforeEach(async () => {
      const { id } = await factory.site({
        defaultBranch,
        demoBranch,
        domain,
        demoDomain,
      });

      site = await Site.findByPk(id, { include: [SiteBranchConfig] });
    });

    afterEach(async () => Promise.all([
      Site.truncate({ force: true, cascade: true }),
      Domain.truncate({ force: true, cascade: true }),
    ]));

    it('default branch url start with site', async () => {
      const siteUrl = new URL(domain);
      const sbc = site.SiteBranchConfigs.find(
        (c) => c.branch === defaultBranch
      );
      await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: sbc.id,
        names: siteUrl.host,
        state: 'provisioned',
      });
      const build = await factory.build({ branch: site.defaultBranch, site });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });
      expect(buildViewLink(build, updatedSite)).to.eql('https://www.main.com/');
    });

    it('should show preview url when site domain is not provisioned', async () => {
      const siteUrl = new URL(domain);
      const sbc = site.SiteBranchConfigs.find(
        (c) => c.branch === defaultBranch
      );
      await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: sbc.id,
        names: siteUrl.host,
        state: 'pending',
      });
      const build = await factory.build({ branch: site.defaultBranch, site });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });
      expect(buildViewLink(build, updatedSite)).to.eql(
        `https://${site.awsBucketName}.${proxyDomain}/site/${site.owner}/${site.repository}/`
      );
    });

    it('demo branch url start with demo', async () => {
      const siteUrl = new URL(demoDomain);
      const sbc = site.SiteBranchConfigs.find(
        (c) => c.branch === demoBranch
      );
      await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: sbc.id,
        names: siteUrl.host,
        state: 'provisioned',
      });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });
      const build = await factory.build({ branch: site.demoBranch, site });
      expect(buildViewLink(build, updatedSite)).to.eql(`${demoDomain}/`);
    });

    describe('should return configured domain', () => {
      it('build.url does not exist', async () => {
        const build = await factory.build({ branch: 'other', site });
        expect(buildViewLink(build, site)).to.equal(
          `${buildUrl(build, site)}/`
        );
      });

      it('build.url does exist', async () => {
        const build = await factory.build({
          branch: 'other',
          site,
          url: 'https://the.url',
        });
        expect(buildViewLink(build, site)).to.equal(`${build.url}/`);
      });
    });
  });
});
