import { dispatch } from '../store';
import { updateRouter as createUpdateRouterAction } from "./actionCreators/navigationActions";

export default {
  redirect(path, method) {
    dispatch(createUpdateRouterAction(path, method));
  }
};
