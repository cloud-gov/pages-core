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

  alertSuccess(message) {
    store.dispatch({
      type: alertActionTypes.HTTP_SUCCESS,
      status: 'info',
      message
    });
  }
}
