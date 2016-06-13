import { errorActionTypes } from '../constants';
import store from '../store';

export default {
  authError(err) {
    store.dispatch({
      type: errorActionTypes.AUTH_ERROR,
    });
  },

  httpError(err) {
    store.dispatch({
      type: errorActionTypes.HTTP_ERROR,
      error: err
    });
  }
}
