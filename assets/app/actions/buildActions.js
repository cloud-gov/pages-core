import api from '../util/federalistApi';
import { buildActionTypes } from '../constants';
import store from '../store';

export default {
  fetchBuilds() {
    api.fetchBuilds().then((builds) => {
      store.dispatch({
        type: buildActionTypes.BUILDS_RECEIVED,
        builds
      });
    });
  }
}
