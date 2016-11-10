const sitesReceivedType = "SITES_RECEIVED";
const siteAddedType = "SITE_ADDED";
const siteUpdatedType = "SITE_UPDATED";
const siteDeletedType = "SITE_DELETED";
const siteFilesReceivedType = "SITE_FILES_RECEIVED";
const siteFileContentReceivedType = "SITE_FILE_CONTENT_RECEIVED";
const siteAssetsReceivedType = "SITE_ASSETS_RECEIVED";
const siteConfigsReceivedType = "SITE_CONFIGS_RECEIVED";
const siteBranchesReceivedType = "SITE_BRANCHES_RECEIVED";
const siteInvalidType = 'SITE_INVALID';
const siteLoadingType = 'SITE_LOADING';

const siteLoading = (site, loading) => ({
  type: siteLoadingType,
  site,
  loading
});

const siteInvalid = (site, invalid) => ({
  type: siteInvalidType,
  site,
  invalid
});

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

const siteFilesReceived = (siteId, files) => ({
  type: siteFilesReceivedType,
  siteId,
  files
})

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
  siteFilesReceived, siteFilesReceivedType,
  siteFileContentReceived, siteFileContentReceivedType,
  siteAssetsReceived, siteAssetsReceivedType,
  siteConfigsReceived, siteConfigsReceivedType,
  siteBranchesReceived, siteBranchesReceivedType,
  siteInvalid, siteInvalidType,
  siteLoading, siteLoadingType
};
