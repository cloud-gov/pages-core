const { expect } = require('chai');

const { buildSiteLink } = require('../../../../api/utils/site');
const factory = require('../../support/factory');

describe('buildSiteLink', () => {
  const awsBucketName = 'federalist-bucket';

  it('should return a site domain when site domain is set', async () => {
    const deployment = 'site';
    const domain = 'https://example.gov/';
    const site = await factory.site({ awsBucketName, domain });
    expect(buildSiteLink(deployment, site)).to.eql(domain);
  });

  it('should return proxy domain with the site path when no site domain', async () => {
    const deployment = 'site';
    const domain = null;
    const site = await factory.site({ awsBucketName, domain });
    expect(buildSiteLink(deployment, site)).to.eql(
      `https://${awsBucketName}.app.cloud.gov/site/${site.owner}/${site.repository}/`
    );
  });

  it('should return a site demo domain when site has demoDomain', async () => {
    const deployment = 'demo';
    const demoDomain = 'https://demo.example.gov/';
    const site = await factory.site({ awsBucketName, demoDomain });
    expect(buildSiteLink(deployment, site)).to.eql(demoDomain);
  });

  it('should return proxy domain with the demo path when no demoDomain', async () => {
    const deployment = 'demo';
    const demoDomain = null;
    const site = await factory.site({ awsBucketName, demoDomain });
    expect(buildSiteLink(deployment, site)).to.eql(
      `https://${awsBucketName}.app.cloud.gov/demo/${site.owner}/${site.repository}/`
    );
  });

  it('should return a proxy route domain with the preview path', async () => {
    const deployment = 'preview';
    const site = await factory.site({ awsBucketName });
    expect(buildSiteLink(deployment, site)).to.eql(
      `https://${awsBucketName}.app.cloud.gov/preview/${site.owner}/${site.repository}/`
    );
  });
});
