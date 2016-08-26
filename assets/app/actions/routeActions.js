import { navigationTypes } from '../constants';
import store from '../store';

export default {
  redirect(path) {
    store.dispatch({
      type: navigationTypes.UPDATE_ROUTER,
      method: 'push',
      arguments: [path]
    });
  }
}
