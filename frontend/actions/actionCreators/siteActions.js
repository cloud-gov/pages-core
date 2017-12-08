const sitesFetchStartedType = 'SITES_FETCH_STARTED';
const sitesReceivedType = 'SITES_RECEIVED';
const siteAddedType = 'SITE_ADDED';
const siteUpdatedType = 'SITE_UPDATED';
const siteDeletedType = 'SITE_DELETED';
const siteUserAddedType = 'SITE_USER_ADDED';

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

const siteUserRemoved = (site, users) => ({
  type: siteUserRemovedType
});

export {
  sitesFetchStarted, sitesFetchStartedType,
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteUserAdded, siteUserAddedType,
};
