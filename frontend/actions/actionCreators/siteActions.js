const sitesReceivedType = "SITES_RECEIVED";
const siteAddedType = "SITE_ADDED";
const siteUpdatedType = "SITE_UPDATED";
const siteDeletedType = "SITE_DELETED";
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
  siteBranchesReceived, siteBranchesReceivedType,
};
