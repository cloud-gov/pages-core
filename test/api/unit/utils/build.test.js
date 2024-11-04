const expect = require('chai').expect;
const { Domain, Site, SiteBranchConfig } = require('../../../../api/models');
const { buildUrl } = require('../../../../api/utils/build');
const factory = require('../../support/factory');
const config = require('../../../../config');

const { proxyDomain } = config.app;

describe('build utils', () => {
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

      site = await Site.findByPk(id, {
        include: [SiteBranchConfig, Domain],
      });
    });

    afterEach(async () =>
      Promise.all([
        Site.truncate({
          force: true,
          cascade: true,
        }),
        Domain.truncate({
          force: true,
          cascade: true,
        }),
      ]),
    );

    it('domained sites have the domain', async () => {
      const siteUrl = new URL(domain);
      const sbc = site.SiteBranchConfigs.find((c) => c.branch === defaultBranch);
      await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: sbc.id,
        names: siteUrl.host,
        state: 'provisioned',
      });
      const build = await factory.build({
        branch: site.defaultBranch,
        site,
      });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });
      expect(buildUrl(build, updatedSite)).to.eql('https://www.main.com/');
    });

    it('should show site url when site domain is not provisioned', async () => {
      const siteUrl = new URL(domain);
      const sbc = site.SiteBranchConfigs.find((c) => c.branch === defaultBranch);
      await factory.domain.create({
        siteId: site.id,
        siteBranchConfigId: sbc.id,
        names: siteUrl.host,
        state: 'pending',
      });
      const build = await factory.build({
        branch: site.defaultBranch,
        site,
      });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });

      const host = `${site.awsBucketName}.${proxyDomain}`;

      expect(buildUrl(build, updatedSite)).to.eql(
        `https://${host}/site/${site.owner}/${site.repository}/`,
      );

      expect(buildUrl(build, updatedSite)).to.eql(`https://${host}${sbc.s3Key}/`);
    });

    it('should show preview url without a branch configuration', async () => {
      const branch = 'anotherbranch';
      const build = await factory.build({
        branch,
        site,
      });
      const updatedSite = await Site.findByPk(site.id, {
        include: [Domain, SiteBranchConfig],
      });
      expect(buildUrl(build, updatedSite)).to.eql(
        `https://${site.awsBucketName}.${proxyDomain}/preview/${site.owner}/${site.repository}/${branch}/`,
      );
    });
  });
});
