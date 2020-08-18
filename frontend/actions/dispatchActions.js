import { reset } from 'redux-form';
import { dispatch } from '../store';
import {
  sitesFetchStarted as createSitesFetchStartedAction,
  sitesReceived as createSitesReceivedAction,
  siteAdded as createSiteAddedAction,
  siteUpdated as createSiteUpdatedAction,
  siteDeleted as createSiteDeletedAction,
  siteUserAdded as createSiteUserAddedAction,
  siteUserRemoved as siteUserRemovedAction,
  siteUserUpdated as createSiteUserUpdatedAction,
  siteBasicAuthSaved as createSiteBasicAuthSavedAction,
  siteBasicAuthRemoved as createSiteBasicAuthRemovedAction,
} from './actionCreators/siteActions';
import {
  showAddNewSiteFields as createShowAddNewSiteFieldsAction,
  hideAddNewSiteFields as createHideAddNewSiteFieldsAction,
} from './actionCreators/addNewSiteFieldsActions';

import { pushHistory } from './routeActions';

const updateRouterToSitesUri = () => {
  pushHistory('/sites');
};

const updateRouterToSiteBuildsUri = (site) => {
  pushHistory(`/sites/${site.id}/builds`);
};

const dispatchSitesFetchStartedAction = () => {
  dispatch(createSitesFetchStartedAction());
};

const dispatchSitesReceivedAction = (sites) => {
  dispatch(createSitesReceivedAction(sites));
};

const dispatchSiteAddedAction = (site) => {
  dispatch(createSiteAddedAction(site));
};

const dispatchSiteUpdatedAction = (site) => {
  dispatch(createSiteUpdatedAction(site));
};

const dispatchSiteDeletedAction = (siteId) => {
  dispatch(createSiteDeletedAction(siteId));
};

const dispatchUserAddedToSiteAction = (site) => {
  dispatch(createSiteUserAddedAction(site));
};

const dispatchUserRemovedFromSiteAction = (site) => {
  dispatch(siteUserRemovedAction(site));
};

const dispatchShowAddNewSiteFieldsAction = () => {
  dispatch(createShowAddNewSiteFieldsAction());
};

const dispatchHideAddNewSiteFieldsAction = () => {
  dispatch(createHideAddNewSiteFieldsAction());
};

const dispatchSiteUserUpdatedAction = (site) => {
  dispatch(createSiteUserUpdatedAction(site));
};

const dispatchSiteBasicAuthRemovedAction = site => dispatch(createSiteBasicAuthRemovedAction(site));

const dispatchSiteBasicAuthSavedAction = site => dispatch(createSiteBasicAuthSavedAction(site));

const dispatchResetFormAction = formName => dispatch(reset(formName));

export {
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
  dispatchHideAddNewSiteFieldsAction,
  dispatchResetFormAction,
  dispatchSiteUserUpdatedAction,
  dispatchSiteBasicAuthRemovedAction,
  dispatchSiteBasicAuthSavedAction,
};
