/* global window:true */

import federalist from '../util/federalistApi';
import alertActions from './alertActions';

import {
  updateRouterToSitesUri,
  updateRouterToSiteBuildsUri,
  dispatchSitesFetchStartedAction,
  dispatchSitesReceivedAction,
  dispatchSiteAddedAction,
  dispatchSiteUpdatedAction,
  dispatchSiteDeletedAction,
  dispatchUserAddedToSiteAction,
  dispatchShowAddNewSiteFieldsAction,
  dispatchSetCurrentSiteAction,
} from './dispatchActions';
import userActions from './userActions';

const alertError = (error) => {
  window.scrollTo(0, 0);
  alertActions.httpError(error.message);
};

export default {
  fetchSites() {
    dispatchSitesFetchStartedAction();
    return federalist.fetchSites()
      .then(dispatchSitesReceivedAction)
      .catch(alertError);
  },

  setCurrentSite(siteId) {
    dispatchSetCurrentSiteAction(siteId);
  },

  addSite(siteToAdd) {
    return federalist.addSite(siteToAdd)
      .then((site) => {
        // site is undefined here if addSite fails
        if (site) {
          dispatchSiteAddedAction(site);
          // route to the builds page for the added site
          updateRouterToSiteBuildsUri(site);
        }
      })
      .catch((err) => {
        alertError(err);
      });
  },

  addUserToSite({ owner, repository }) {
    return federalist.addUserToSite({ owner, repository })
      .then(dispatchUserAddedToSiteAction)
      .then(updateRouterToSitesUri)
      .catch((err) => {
        // Getting a 404 here signals that the site does not
        // yet exist in Federalist, so we want to show the
        // additional Add New Site fields
        if (err.response && err.response.status === 404) {
          dispatchShowAddNewSiteFieldsAction(err);
        } else {
          alertError(err);
        }
      });
  },

  removeUserFromSite(siteId, userId, me = false) {
    return federalist.removeUserFromSite(siteId, userId)
    .then(this.fetchSites)
    .then(() => {
      if (me) { return updateRouterToSitesUri(); }

      return userActions.fetchUser;
    })
    .then(() => alertActions.alertSuccess('User successfully removed.'))
    .catch(alertError);
  },

  updateSite(site, data) {
    return federalist.updateSite(site, data)
      .then((updatedSite) => {
        if (updatedSite) {
          dispatchSiteUpdatedAction(updatedSite);
        }
      })
      .catch(alertError);
  },

  deleteSite(siteId) {
    return federalist.deleteSite(siteId)
      .then(updateRouterToSitesUri)
      .then(dispatchSiteDeletedAction.bind(null, siteId))
      .catch(alertError);
  },
};
