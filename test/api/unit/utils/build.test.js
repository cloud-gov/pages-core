const expect = require('chai').expect;

const { buildViewLink, buildUrl } = require('../../../../api/utils/build');
const factory = require('../../support/factory');
const config = require('../../../../config');

describe('build utils', () => {
  describe('buildUrl', () => {
    let site;
    before(async () => {
      site = await factory.site({ defaultBranch: 'main', demoBranch: 'staging' });
    });

    it('default branch url start with site', async () => {
      let build = await factory.build({ branch: site.defaultBranch, site });
      const url = [
        `https://${site.awsBucketName}.${config.app.domain}`,
        `/site/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('demo branch url start with demo', async () => {
      const build = await factory.build({ branch: site.demoBranch, site });
      const url = [
        `https://${site.awsBucketName}.${config.app.domain}`,
        `/demo/${site.owner}/${site.repository}`,
      ].join('');
      expect(buildUrl(build, site)).to.eql(url);
    });

    it('non-default/demo branch url start with preview', async () => {
      const build = await factory.build({ branch: 'other', site });
      const url = [
        `https://${site.awsBucketName}.${config.app.domain}`,
        `/preview/${site.owner}/${site.repository}/other`,
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
      site = await factory.site({ defaultBranch, demoBranch, domain, demoDomain });
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
        expect(buildViewLink(build, site)).to.equal(`${buildUrl(build, site)}/`);
      });

      it('build.url does exist', async () => {
        const build = await factory.build({ branch: 'other', site, url: 'https://the.url' });
        expect(buildViewLink(build, site)).to.equal(`${build.url}/`);
      });
    });
  });
});