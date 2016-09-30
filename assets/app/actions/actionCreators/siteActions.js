const sitesReceivedType = "SITES_RECEIVED";
const siteAddedType = "SITE_ADDED";
const siteUpdatedType = "SITE_UPDATED";
const siteDeletedType = "SITE_DELETED";
const siteFileContentReceivedType = "SITE_FILE_CONTENT_RECEIVED";
const siteAssetsReceivedType = "SITE_ASSETS_RECEIVED";
const siteConfigsReceivedType = "SITE_CONFIGS_RECEIVED";
const siteBranchesReceivedType = "SITE_BRANCHES_RECEIVED";

const sitesReceived = sites => ({
  type: sitesReceivedType,
  sites
});

const siteAdded = site => ({
  type: siteAddedType,
  site
});

const siteUpdated = site => ({
  type: siteUpdatedType,
  siteId: site.id,
  site
});

const siteDeleted = siteId => ({
  type: siteDeletedType,
  siteId
});

const siteFileContentReceived = (siteId, fileContent) => ({
  type: siteFileContentReceivedType,
  siteId,
  file: fileContent
});

const siteAssetsReceived = (siteId, assets) => ({
  type: siteAssetsReceivedType,
  siteId,
  assets
});

const siteConfigsReceived = (siteId, configs) => ({
  type: siteConfigsReceivedType,
  siteId,
  configs
});

const siteBranchesReceived = (siteId, branches) => ({
  type: siteBranchesReceivedType,
  siteId,
  branches
});

export {
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteFileContentReceived, siteFileContentReceivedType,
  siteAssetsReceived, siteAssetsReceivedType,
  siteConfigsReceived, siteConfigsReceivedType,
  siteBranchesReceived, siteBranchesReceivedType
};
