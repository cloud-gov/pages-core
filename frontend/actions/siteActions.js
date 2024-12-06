import federalist from '../util/federalistApi';
import alertActions from './alertActions';

import {
  dispatchSitesFetchStartedAction,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchHideAddNewSiteFieldsAction,
  dispatchResetFormAction,
  dispatchSiteBasicAuthRemovedAction,
  dispatchSiteBasicAuthSavedAction,
} from './dispatchActions';

const alertError = (error) => {
  window.scrollTo(0, 0);
  alertActions.httpError(error.message);
};

const resetFormOnError = (err) => {
  dispatchResetFormAction('addRepoSite');
  dispatchHideAddNewSiteFieldsAction();
  alertError(err);
};

export default {
  fetchSites() {
    dispatchSitesFetchStartedAction();
    return federalist.fetchSites().then(dispatchSitesReceivedAction).catch(alertError);
  },

  addSite(siteToAdd, navigate) {
    dispatchSitesFetchStartedAction();
    return federalist
      .addSite(siteToAdd)
      .then((site) => {
        // site is undefined here if addSite fails
        if (site) {
          dispatchSiteAddedAction(site);
          // route to the builds page for the added site
          navigate(`/sites/${site.id}/builds`);
        }
      })
      .catch((err) => {
        resetFormOnError(err);
      });
  },

  updateSite(site, data) {
    return federalist
      .updateSite(site, data)
      .then((updatedSite) => {
        if (updatedSite) {
          dispatchSiteUpdatedAction(updatedSite);
        }
      })
      .catch(alertError);
  },

  deleteSite(siteId) {
    dispatchSitesFetchStartedAction();
    return federalist
      .deleteSite(siteId)
      .then(dispatchSiteDeletedAction.bind(null, siteId))
      .catch(alertError);
  },

  removeBasicAuthFromSite(siteId) {
    return federalist
      .removeBasicAuthFromSite(siteId)
      .then((site) => {
        if (site) {
          dispatchSiteBasicAuthRemovedAction(site);
        }
      })
      .then(() => alertActions.alertSuccess('Successfully removed basic authentication.'))
      .catch(alertError);
  },

  saveBasicAuthToSite(siteId, basicAuth) {
    return federalist
      .saveBasicAuthToSite(siteId, basicAuth)
      .then((site) => {
        if (site) {
          dispatchSiteBasicAuthSavedAction(site);
        }
      })
      .then(() => alertActions.alertSuccess('Successfully added basic authentcation.'))
      .catch(alertError);
  },
};
