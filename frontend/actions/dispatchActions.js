import { dispatch } from '../store';
import {
  sitesFetchStarted as createSitesFetchStartedAction,
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

const dispatchSitesFetchStartedAction = () => {
  dispatch(createSitesFetchStartedAction())
}

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
  dispatchSitesFetchStartedAction,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteBranchesReceivedAction,
};
