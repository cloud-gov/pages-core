const Features = require('../features');
const ProxyDataSync = require('./ProxyDataSync');
const S3SiteRemover = require('./S3SiteRemover');

async function destroySite(site) {
  const destroyComponents = [
    S3SiteRemover.removeSite(site),
    S3SiteRemover.removeInfrastructure(site),
    site.destroy(),
  ];

  if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
    destroyComponents.push(ProxyDataSync.removeSite(site));
  }

  await Promise.all(destroyComponents);
  return site
}

module.exports = {
  destroySite
};
