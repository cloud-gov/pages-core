const expect = require('chai').expect;
const { Site, SiteBranchConfig } = require('../../../../api/models');
const { buildViewLink, buildUrl } = require('../../../../api/utils/build');
const factory = require('../../support/factory');
const config = require('../../../../config');

describe('build utils', () => {
  describe('buildUrl', () => {
    let site;
    before(async () => {
      const { id } = await factory.site({
        defaultBranch: 'main',
        demoBranch: 'staging',
      });
      site = await Site.findByPk(id, { include: [SiteBranchConfig] });
    });

    it('default branch url start with site', async () => {
      let build = await factory.build({ branch: site.defaultBranch, site });
      const url = [
        `https://${site.awsBucketName}.${config.app.proxyDomain}`,
        `/site/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('demo branch url start with demo', async () => {
      const build = await factory.build({ branch: site.demoBranch, site });
      const url = [
        `https://${site.awsBucketName}.${config.app.proxyDomain}`,
        `/demo/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('non-default/demo branch url start with preview', async () => {
      const build = await factory.build({ branch: 'other', site });
      const url = [
        `https://${site.awsBucketName}.${config.app.proxyDomain}`,
        `/preview/${site.owner}/${site.repository}/other`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });
  });

  describe('buildUrl with other site branch context and s3Key', () => {
    let site;
    let siteBranchConfig;
    const branch = 'other-branch';
    const context = 'other';
    const s3Key = 'test/other';

    before(async () => {
      const interimSite = await factory.site({}, { noSiteBranchConfig: true });
      siteBranchConfig = await SiteBranchConfig.create({
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
        `https://${site.awsBucketName}.${config.app.proxyDomain}`,
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
    before(async () => {
      const { id } = await factory.site({
        defaultBranch,
        demoBranch,
        domain,
        demoDomain,
      });

      site = await Site.findByPk(id, { include: [SiteBranchConfig] });
    });

    it('default branch url start with site', async () => {
      const build = await factory.build({ branch: site.defaultBranch, site });
      expect(buildViewLink(build, site)).to.eql('https://www.main.com/');
    });

    it('demo branch url start with demo', async () => {
      const build = await factory.build({ branch: site.demoBranch, site });
      expect(buildViewLink(build, site)).to.eql(`${demoDomain}/`);
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
