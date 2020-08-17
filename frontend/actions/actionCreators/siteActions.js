const sitesFetchStartedType = 'SITES_FETCH_STARTED';
const sitesReceivedType = 'SITES_RECEIVED';
const siteAddedType = 'SITE_ADDED';
const siteUpdatedType = 'SITE_UPDATED';
const siteDeletedType = 'SITE_DELETED';
const siteUserAddedType = 'SITE_USER_ADDED';
const siteUserRemovedType = 'SITE_USER_REMOVED';
const siteUserUpdatedType = 'SITE_USER_UPDATED';
const siteBranchesReceivedType = 'SITE_BRANCHES_RECIEVED';
const siteBasicAuthSavedType = 'SITE_BASIC_AUTH_SAVED';
const siteBasicAuthRemovedType = 'SITE_BASIC_AUTH_REMOVED';

const sitesFetchStarted = () => ({
  type: sitesFetchStartedType,
});

const sitesReceived = sites => ({
  type: sitesReceivedType,
  sites,
});

const siteAdded = site => ({
  type: siteAddedType,
  site,
});

const siteUpdated = site => ({
  type: siteUpdatedType,
  siteId: site.id,
  site,
});

const siteDeleted = siteId => ({
  type: siteDeletedType,
  siteId,
});

const siteUserAdded = site => ({
  type: siteUserAddedType,
  site,
});

const siteUserRemoved = site => ({
  type: siteUserRemovedType,
  site,
});

const siteUserUpdated = site => ({
  type: siteUserUpdatedType,
  siteId: site.id,
  site,
});

const siteBasicAuthSaved = site => ({
  type: siteBasicAuthSavedType,
  siteId: site.id,
  site,
});

const siteBasicAuthRemoved = site => ({
  type: siteBasicAuthRemovedType,
  siteId: site.id,
  site,
});

export {
  sitesFetchStarted, sitesFetchStartedType,
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteUserAdded, siteUserAddedType,
  siteUserRemoved, siteUserRemovedType,
  siteUserUpdated, siteUserUpdatedType,
  siteBranchesReceivedType,
  siteBasicAuthSaved, siteBasicAuthSavedType,
  siteBasicAuthRemoved, siteBasicAuthRemovedType,
};
