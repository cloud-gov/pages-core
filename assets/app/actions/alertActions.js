import { alertActionTypes } from '../constants';
import store from '../store';

export default {
  authError(err) {
    store.dispatch({
      type: alertActionTypes.AUTH_ERROR,
    });
  },

  httpError(message) {
    store.dispatch({
      type: alertActionTypes.HTTP_ERROR,
      status: 'error',
      message
    });
  },

  alertError(message) {
    this.httpError(message);
  },

  alertSuccess(message) {
    store.dispatch({
      type: alertActionTypes.HTTP_SUCCESS,
      status: 'info',
      message
    });
  },

  setStale() {
    store.dispatch({
      type: alertActionTypes.SET_STALE
    });
  },

  clear() {
    store.dispatch({
      type: alertActionTypes.CLEAR
    });
  }
};
