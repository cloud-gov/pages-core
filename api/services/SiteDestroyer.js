const S3SiteRemover = require('./S3SiteRemover');

async function destroySite(site) {
  const destroyComponents = [
    S3SiteRemover.removeSite(site)
      .then(() => S3SiteRemover.removeInfrastructure(site)),
    site.destroy(),
  ];

  await Promise.all(destroyComponents);
  return site;
}

module.exports = {
  destroySite,
};
