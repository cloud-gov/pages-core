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
  dispatchUserRemovedFromSiteAction,
  dispatchShowAddNewSiteFieldsAction,
} from './dispatchActions';


const alertError = (error) => {
  alertActions.httpError(error.message);
};

const onUserRemoveFromSite = (site) => {
  if (site) {
    dispatchUserRemovedFromSiteAction(site);
  }

  alertActions.alertSuccess('User successfully removed.');
};

export default {
  fetchSites() {
    dispatchSitesFetchStartedAction();
    return federalist.fetchSites()
      .then(dispatchSitesReceivedAction)
      .catch(alertError);
  },

  addSite(siteToAdd) {
    return federalist.addSite(siteToAdd)
      .then((site) => {
        dispatchSiteAddedAction(site);
        return site;
      })
      .then(updateRouterToSiteBuildsUri)
      .catch(alertError);
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
          // otherwise something else went wrong so redirect and
          // show the error like in the other actions
          updateRouterToSitesUri();
          alertError(err);
        }
      });
  },

  removeUserFromSite(siteId, userId, me = false) {
    const onRemoveUser = federalist.removeUserFromSite(siteId, userId);

    if (me) {
      return onRemoveUser
        .then(this.fetchSites)
        .then(() => {
          updateRouterToSitesUri();
          onUserRemoveFromSite();
        });
    }

    return onRemoveUser.then(onUserRemoveFromSite);
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
      .then(dispatchSiteDeletedAction.bind(null, siteId))
      .then(updateRouterToSitesUri)
      .catch(alertError);
  },
};
