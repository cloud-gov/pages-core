const { SiteBranchConfig, Domain } = require('../../../../api/models');
const siteFactory = require('./site');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${counters[key]}-${key}`;
}

function build(params = {}) {
  const {
    context = Domain.Contexts.Site,
    names = increment('www.example.gov'),
  } = params;

  return Domain.build({
    ...params,
    context,
    names,
  });
}

async function create(params = {}) {
  let siteId = params.siteId;
  let siteBranchConfigId = params.siteBranchConfigId;

  if (siteId && !siteBranchConfigId) {
    const where = {
      siteId: params.siteId,
      context: params.context || Domain.Contexts.Site,
    };

    const sbc = await SiteBranchConfig.findOne({ where });

    siteBranchConfigId = sbc.id;
  }

  if (!params.siteId) {
    const site = await siteFactory({ include: SiteBranchConfig });
    siteId = site.id;
    siteBranchConfigId = site.SiteBranchConfigs[0].id;
  }

  return build({
    ...params,
    siteId,
    siteBranchConfigId,
  }).save();
}

function truncate() {
  return Domain.truncate({ force: true, cascade: true });
}

module.exports = {
  build,
  create,
  truncate,
};
