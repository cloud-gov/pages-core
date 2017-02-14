import federalist from '../util/federalistApi';
import github from '../util/githubApi';
import alertActions from './alertActions';

import {
  updateRouterToSitesUri,
  updateRouterToSpecificSiteUri,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchSiteBranchesReceivedAction,
  dispatchSiteInvalidAction,
  dispatchSiteLoadingAction
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
      .then(() => site);
  },

  cloneRepo(destination, template) {
    return github.createRepo(destination, template).then(() => {
      return federalist.addSite(destination)
    }).then((site) => {
      dispatchSiteAddedAction(site);
      updateRouterToSpecificSiteUri(site.id);
    }).catch(alertError);
  },

  siteExists(site) {
    return github.getRepo(site)
      .then(() => site)
      .catch((error) => {
        dispatchSiteLoadingAction(site, false);
        dispatchSiteInvalidAction(site, true);

        throw new Error(error);
      });
  },
};

function throwRuntime(error) {
  const runtimeErrors = ['TypeError'];
  const isRuntimeError = runtimeErrors.find((e) => e === error.name);
  if (isRuntimeError) {
    throw error;
  }
}
