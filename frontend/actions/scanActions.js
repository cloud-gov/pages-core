/* global window:true */

import federalist from '../util/federalistApi';
import alertActions from './alertActions';

import {
  dispatchScanUploadStartedAction,
  dispatchScanUploadedAction,
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
  upload(data) {
    dispatchScanUploadStartedAction();
    return federalist.uploadScan(data)
      .then(dispatchScanUploadedAction)
      .then(() => alertActions.alertSuccess('Successfully uploaded.'))
      .catch(alertError);
  },
};
