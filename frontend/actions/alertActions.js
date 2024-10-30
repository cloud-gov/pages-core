import { error as errorNotification } from 'react-notification-system-redux';

import { dispatch } from '../store';

import {
  authError as createAuthErrorAction,
  httpError as createHttpErrorAction,
  httpSuccess as createHttpSuccessAction,
  setStale as createSetStaleAction,
  clear as createClearAction,
} from './actionCreators/alertActions';

export default {
  authError() {
    dispatch(createAuthErrorAction());
  },

  httpError(message) {
    dispatch(createHttpErrorAction(message));
    dispatch(
      errorNotification({
        title: 'Error',
        message,
        position: 'tr',
        autoDismiss: 0,
      }),
    );
  },

  alertError(message) {
    this.httpError(message);
  },

  alertSuccess(message) {
    dispatch(createHttpSuccessAction(message));
  },

  setStale() {
    dispatch(createSetStaleAction());
  },

  clear() {
    dispatch(createClearAction());
  },

  update(isStale) {
    if (isStale) {
      this.clear();
    } else {
      this.setStale();
    }
  },
};
