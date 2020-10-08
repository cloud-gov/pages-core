/* global window:true */
import federalist from '../util/federalistApi';
import { httpError } from './actionCreators/alertActions';
import {
  userEnvironmentVariablesFetchStarted,
  userEnvironmentVariablesReceived,
  userEnvironmentVariableAdded,
  userEnvironmentVariableDeleted,
} from './actionCreators/userEnvironmentVariableActions';

export function fetchUserEnvironmentVariables(siteId) {
  return (dispatch) => {
    dispatch(userEnvironmentVariablesFetchStarted(siteId));
    return federalist.fetchUserEnvironmentVariables(siteId)
      .then(uevs => dispatch(userEnvironmentVariablesReceived(siteId, uevs)))
      .catch((error) => {
        window.scrollTo(0, 0);
        dispatch(httpError(error.message, { siteId }));
      });
  };
}

export function deleteUserEnvironmentVariable(siteId, userEnvironmentVariableId) {
  return dispatch => federalist.deleteUserEnvironmentVariable(siteId, userEnvironmentVariableId)
    .then(() => dispatch(userEnvironmentVariableDeleted(siteId, userEnvironmentVariableId)))
    .catch((error) => {
      window.scrollTo(0, 0);
      dispatch(httpError(error.message, { siteId }));
    });
}

export function addUserEnvironmentVariable(siteId, userEnvironmentVariable) {
  return dispatch => federalist.createUserEnvironmentVariable(siteId, userEnvironmentVariable)
    .then(uev => dispatch(userEnvironmentVariableAdded(siteId, uev)))
    .catch((error) => {
      window.scrollTo(0, 0);
      dispatch(httpError(error.message, { siteId }));
    });
}

export default {
  fetchUserEnvironmentVariables,
  deleteUserEnvironmentVariable,
  addUserEnvironmentVariable,
};
