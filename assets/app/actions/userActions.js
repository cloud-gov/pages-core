import federalist from '../util/federalistApi';
import { userActionTypes } from '../constants';
import store from '../store';

export default {
  fetchUser() {
    federalist.fetchUser().then((user) => {
      store.dispatch({
        type: userActionTypes.USER_RECEIVED,
        user
      });
    });
  },

  logout() {
    store.dispatch({
      type: userActionTypes.USER_LOGOUT
    });
  }
}
