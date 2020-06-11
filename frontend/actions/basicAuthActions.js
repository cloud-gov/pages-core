/* global window:true */
import federalist from '../util/federalistApi';
import { httpError } from './actionCreators/alertActions';
import {
  basicAuthFetchStarted,
  basicAuthReceived,
  basicAuthSaved,
  basicAuthRemoved,
} from './actionCreators/basicAuthActions';


export function fetchBasicAuth(siteId) {
  return (dispatch) => {
    dispatch(basicAuthFetchStarted(siteId));
    return federalist.fetchBasicAuth(siteId)
      .then(basicAuth => dispatch(basicAuthReceived(siteId, basicAuth)))
      .catch((error) => {
        window.scrollTo(0, 0);
        dispatch(httpError(error.message, { siteId }));
      });
  };
}

export function removeBasicAuth(siteId) {
  return dispatch => federalist.removeBasicAuth(siteId)
    .then(() => dispatch(basicAuthRemoved(siteId)))
    .catch((error) => {
      window.scrollTo(0, 0);
      dispatch(httpError(error.message, { siteId }));
    });
}

export function saveBasicAuth(siteId, basicAuth) {
  return dispatch => federalist.saveBasicAuth(siteId, basicAuth)
    .then(savedBasicAuth => dispatch(basicAuthSaved(siteId, savedBasicAuth)))
    .catch((error) => {
      window.scrollTo(0, 0);
      dispatch(httpError(error.message, { siteId }));
    });
}

export default {
  fetchBasicAuth,
  removeBasicAuth,
  saveBasicAuth,
};
