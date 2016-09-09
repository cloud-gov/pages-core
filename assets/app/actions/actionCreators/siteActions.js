import { siteActionTypes as types } from '../../constants';

const sitesReceivedType = types.SITES_RECEIVED;

const sitesReceived = sites => ({
  type: sitesReceivedType,
  sites
});

export { sitesReceivedType, sitesReceived };
