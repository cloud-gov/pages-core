import { dispatch } from '../store';
import {
  sitesReceived as createSitesReceivedAction,
  siteAdded as createSiteAddedAction,
  siteUpdated as createSiteUpdatedAction,
  siteDeleted as createSiteDeletedAction,
  siteBranchesReceived as createSiteBranchesReceivedAction,
  siteInvalid as createSiteInvalidAction,
  siteLoading as createSiteLoadingAction
} from './actionCreators/siteActions';
import { pushHistory } from './routeActions';

const updateRouterToSitesUri = () => {
  pushHistory(`/sites`);
};

const updateRouterToSpecificSiteUri = siteId => {
  pushHistory(`/sites/${siteId}`);
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

const dispatchSiteInvalidAction = (site, isInvalid) => {
  dispatch(createSiteInvalidAction(site, isInvalid));
};

const dispatchSiteLoadingAction = (site, isLoading) => {
  dispatch(createSiteLoadingAction(site, isLoading));
}

export {
  updateRouterToSitesUri,
  updateRouterToSpecificSiteUri,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteBranchesReceivedAction,
  dispatchSiteInvalidAction,
  dispatchSiteLoadingAction
};
