import store from '../store';
import { updateRouter as updateRouterActionCreator } from "./actionCreators/navigationActions";

export default {
  redirect(path) {
    const action = updateRouterActionCreator(path);
    store.dispatch(action);
  }
};
