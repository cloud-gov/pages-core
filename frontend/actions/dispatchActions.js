import { dispatch } from '../store';
import {
  sitesReceived as createSitesReceivedAction,
  siteAdded as createSiteAddedAction,
  siteUpdated as createSiteUpdatedAction,
  siteDeleted as createSiteDeletedAction,
  siteBranchesReceived as createSiteBranchesReceivedAction,
} from './actionCreators/siteActions';
import { pushHistory } from './routeActions';

const updateRouterToSitesUri = () => {
  pushHistory(`/sites`);
};

const dispatchSitesReceivedAction = sites => {
  dispatch(createSitesReceivedAction(sites));
};

const dispatchSiteAddedAction = site => {
  dispatch(createSiteAddedAction(site));
};

const dispatchSiteUpdatedAction = site => {
  dispatch(createSiteUpdatedAction(site));
};

const dispatchSiteDeletedAction = siteId => {
  dispatch(createSiteDeletedAction(siteId));
};

const dispatchSiteBranchesReceivedAction = (siteId, branches) => {
  dispatch(createSiteBranchesReceivedAction(siteId, branches));
};

export {
  updateRouterToSitesUri,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteBranchesReceivedAction,
};
