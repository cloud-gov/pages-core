const { Site, SiteBranchConfig } = require('../../../../api/models');
const { generateSubdomain } = require('../../../../api/utils');

let siteAttsStep = 1;

function generateUniqueAtts() {
  const res = {
    owner: `repo-owner-${siteAttsStep}`,
    repository: `repo-name-${siteAttsStep}`,
  };
  siteAttsStep += 1;
  return res;
}

function makeAttributes(overrides = {}) {
  const { owner, repository } = generateUniqueAtts();

  return {
    owner,
    repository,
    engine: 'jekyll',
    s3ServiceName: 'federalist-dev-s3',
    awsBucketName: 'cg-123456789',
    awsBucketRegion: 'us-gov-west-1',
    defaultBranch: 'main',
    subdomain: generateSubdomain(owner, repository),
    ...overrides,
  };
}

async function addSiteBranchConfigs(site) {
  const {
    id: siteId,
    defaultBranch,
    demoBranch,
    defaultConfig,
    demoConfig,
    previewConfig,
    demoDomain,
  } = site;

  if (defaultBranch) {
    await SiteBranchConfig.create({
      siteId,
      branch: defaultBranch,
      s3Key: `/site/${site.owner}/${site.repository}`,
      config: defaultConfig,
      context: 'site',
    });
  }

  if (demoBranch || demoDomain) {
    await SiteBranchConfig.create({
      siteId,
      s3Key: `/demo/${site.owner}/${site.repository}`,
      branch: demoBranch || 'demo',
      config: demoConfig || {},
      context: 'demo',
    });
  }

  if (previewConfig) {
    await SiteBranchConfig.create({
      siteId,
      config: previewConfig,
      context: 'preview',
    });
  }
}

function site(overrides, options = {}) {
  let site;

  return Promise.props(makeAttributes(overrides))
    .then((attributes) => {
      return Site.create(attributes);
    })
    .then(async (siteModel) => {
      site = siteModel;
      if (!options.noSiteBranchConfig) {
        await addSiteBranchConfigs(site);
      }
    })
    .then(() =>
      Site.findByPk(site.id, {
        include: SiteBranchConfig,
      }),
    );
}

module.exports = site;
