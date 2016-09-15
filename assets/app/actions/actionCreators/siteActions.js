import { siteActionTypes as types } from '../../constants';

const sitesReceivedType = types.SITES_RECEIVED;
const siteAddedType = types.SITE_ADDED;
const siteUpdatedType = types.SITE_UPDATED;
const siteDeletedType = types.SITE_DELETED;
const siteFileContentReceivedType = types.SITE_FILE_CONTENT_RECEIVED;
const siteAssetsReceivedType = types.SITE_ASSETS_RECEIVED;

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

export {
  sitesReceivedType, sitesReceived,
  siteAddedType, siteAdded,
  siteUpdated, siteUpdatedType,
  siteDeleted, siteDeletedType,
  siteFileContentReceived, siteFileContentReceivedType,
  siteAssetsReceived, siteAssetsReceivedType
};
