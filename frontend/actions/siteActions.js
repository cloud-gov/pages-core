import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import alertActions from './alertActions';

import {
  updateRouterToSitesUri,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteBranchesReceivedAction,
} from './dispatchActions';


const alertError = error => {
  alertActions.httpError(error.message);
};


export default {
  fetchSites() {
    return federalist.fetchSites()
      .then(dispatchSitesReceivedAction)
      .catch(alertError);
  },

  addSite(siteToAdd) {
    return federalist.addSite(siteToAdd)
      .then(dispatchSiteAddedAction)
      .then(updateRouterToSitesUri)
      .catch(alertError);
  },

  updateSite(site, data) {
    return federalist.updateSite(site, data)
      .then(dispatchSiteUpdatedAction)
      .catch(alertError);
  },

  deleteSite(siteId) {
    return federalist.deleteSite(siteId)
      .then(dispatchSiteDeletedAction.bind(null, siteId))
      .then(updateRouterToSitesUri)
      .catch(alertError);
  },

  fetchBranches(site) {
    return github.fetchBranches(site)
      .then(dispatchSiteBranchesReceivedAction.bind(null, site.id))
      .then(() => site)
      .catch(alertError);
  },
};
