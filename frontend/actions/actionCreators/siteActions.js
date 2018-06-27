const sitesFetchStartedType = 'SITES_FETCH_STARTED';
const sitesReceivedType = 'SITES_RECEIVED';
const siteAddedType = 'SITE_ADDED';
const siteUpdatedType = 'SITE_UPDATED';
const siteDeletedType = 'SITE_DELETED';
const siteUserAddedType = 'SITE_USER_ADDED';
const siteUserRemovedType = 'SITE_USER_REMOVED';
const setCurrentSiteType = 'SET_CURRENT_SITE';

const sitesFetchStarted = () => ({
  type: sitesFetchStartedType,
});

const sitesReceived = sites => ({
  type: sitesReceivedType,
  sites,
});

const siteAdded = site => ({
  type: siteAddedType,
  site: site || [],
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

const setCurrentSite = siteId => ({
  type: setCurrentSiteType,
  siteId,
});

export {
  sitesFetchStarted, sitesFetchStartedType,
  sitesReceived, sitesReceivedType,
  siteAdded, siteAddedType,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteUserAdded, siteUserAddedType,
  siteUserRemoved, siteUserRemovedType,
  setCurrentSiteType, setCurrentSite,
};
