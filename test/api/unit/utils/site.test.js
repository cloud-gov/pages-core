const { expect } = require('chai');

const { siteViewLink, siteViewDomain, hideBasicAuthPassword } = require('../../../../api/utils/site');
const factory = require('../../support/factory');
const config = require('../../../../config');

const awsBucketName = 'federalist-bucket';
const getTestDomain = (subdomain) => config.app.proxyPreviewHost.replace('*', subdomain);

describe('site utils', () => {
  const defaultProxyEgeLinks = process.env.FEATURE_PROXY_EDGE_LINKS;

  beforeEach(() => {
    process.env.FEATURE_PROXY_EDGE_LINKS = 'true'
  });

  after(() => {
    process.env.FEATURE_PROXY_EDGE_LINKS = defaultProxyEgeLinks;
  });
  describe('siteViewLink', () => {

    it('should return a site domain when site domain is set', async () => {
      const deployment = 'site';
      const domain = 'https://example.gov/';
      const site = await factory.site({ awsBucketName, domain });
      expect(siteViewLink(site, deployment)).to.eql(domain);
    });

    it('should return proxy domain with the site path when no site domain', async () => {
      const deployment = 'site';
      const domain = null;
      const site = await factory.site({ awsBucketName, domain });
      expect(siteViewLink(site, deployment)).to.eql(
        `${getTestDomain(site.subdomain)}/site/${site.owner}/${site.repository}/`
      );
    });

    it('should return a site demo domain when site has demoDomain', async () => {
      const deployment = 'demo';
      const demoDomain = 'https://demo.example.gov/';
      const site = await factory.site({ awsBucketName, demoDomain });
      expect(siteViewLink(site, deployment)).to.eql(demoDomain);
    });

    it('should return proxy domain with the demo path when no demoDomain', async () => {
      const deployment = 'demo';
      const demoDomain = null;
      const site = await factory.site({ awsBucketName, demoDomain });
      expect(siteViewLink(site, deployment)).to.eql(
        `${getTestDomain(site.subdomain)}/demo/${site.owner}/${site.repository}/`
      );
    });

    it('should return a proxy route domain with the preview path', async () => {
      const deployment = 'preview';
      const site = await factory.site({ awsBucketName });
      expect(siteViewLink(site, deployment)).to.eql(
        `${getTestDomain(site.subdomain)}/preview/${site.owner}/${site.repository}/`
      );
    });

    it('password should be hidden', async () => {
      const basicAuth = { usermame: 'username', password: 'password' };;
      expect(hideBasicAuthPassword(basicAuth)).to.deep.eql({
        username: basicAuth.username,
        password: '**********',
      });
    });
  });

  describe('siteViewDomain', () => {
    it('should return domain on @host=config.app.proxyPreviewHost', async () => {
      const site = await factory.site({ awsBucketName });
      expect(siteViewDomain(site)).equals(getTestDomain(site.subdomain));
    });

    it('should return domain on app.cloud.gov when when env FEATURE_PROXY_EDGE_LINKS=false', async () => {
      process.env.FEATURE_PROXY_EDGE_LINKS = 'false';
      const site = await factory.site({ awsBucketName });
      expect(siteViewDomain(site)).equals(`https://${site.awsBucketName}.app.cloud.gov`);
      process.env.FEATURE_PROXY_EDGE_LINKS = 'true';
    });
  });
});