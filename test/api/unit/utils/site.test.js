const { expect } = require('chai');

const { siteViewLink, hideBasicAuthPassword } = require('../../../../api/utils/site');
const factory = require('../../support/factory');
const config = require('../../../../config');

const getTestDomain = (subdomain) => config.app.proxyPreviewHost.replace('*', subdomain);

describe('siteViewLink', () => {
  const awsBucketName = 'federalist-bucket';

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
