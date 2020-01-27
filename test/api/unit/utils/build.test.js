const expect = require('chai').expect;

const { buildViewLink, buildUrl } = require('../../../../api/utils/build');
const factory = require('../../support/factory');

describe('buildUrl', () => {
  let site;
  before(async () => {
    site = await factory.site({ defaultBranch: 'master', demoBranch: 'staging' });
  });

  it('default branch url start with site', async () => {
    let build = await factory.build({ branch: site.defaultBranch, site });
    const url = [
      `https://${site.awsBucketName}.app.cloud.gov`,
      `/site/${site.owner}/${site.repository}`,
    ].join('');
    expect(buildUrl(build, site)).to.eql(url);
  });

  it('demo branch url start with demo', async () => {
    const build = await factory.build({ branch: site.demoBranch, site });
    const url = [
      `https://${site.awsBucketName}.app.cloud.gov`,
      `/demo/${site.owner}/${site.repository}`,
    ].join('');
    expect(buildUrl(build, site)).to.eql(url);
  });

  it('non-default/demo branch url start with preview', async () => {
    const build = await factory.build({ branch: 'other', site });
    const url = [
      `https://${site.awsBucketName}.app.cloud.gov`,
      `/preview/${site.owner}/${site.repository}/other`,
    ].join('');
    expect(buildUrl(build, site)).to.eql(url);
  });
});

describe('viewLink', () => {
  let site;
  const defaultBranch = 'master';
  const demoBranch = 'demo';
  const domain = 'https://www.master.com';
  const demoDomain = 'https://www.demo.com';
  before(async () => {
    site = await factory.site({ defaultBranch, demoBranch, domain, demoDomain });
  });

  it('default branch url start with site', async () => {
    const build = await factory.build({ branch: site.defaultBranch, site });
    expect(buildViewLink(build, site)).to.eql(`${domain}/`);
  });

  it('demo branch url start with demo', async () => {
    const build = await factory.build({ branch: site.demoBranch, site });
    expect(buildViewLink(build, site)).to.eql(`${demoDomain}/`);
  });

  it('non-default/demo branch url start with preview', async () => {
    const build = await factory.build({ branch: 'other', site });
    expect(buildViewLink(build, site)).to.eql(`${buildUrl(build, site)}/`);
  });
});
