import { navigationTypes } from '../constants';
import store from '../store';

export default {
  changedRoute(location) {
    store.dispatch({
      type: navigationTypes.ROUTE_CHANGED,
      location
    });
  }
}
