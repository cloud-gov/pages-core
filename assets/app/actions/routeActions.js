import { dispatch } from '../store';
import { updateRouter as createUpdateRouterAction } from "./actionCreators/navigationActions";

export default {
  redirect(path) {
    dispatch(createUpdateRouterAction(path));
  }
};
