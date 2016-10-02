import { dispatch } from '../store';
import {
  pushRouterHistory as createPushHistoryRouterAction,
  replaceRouterHistory as createReplaceHistoryRouterAction
} from "./actionCreators/navigationActions";

export default {
  pushHistory(path, method) {
    dispatch(createPushHistoryRouterAction(path));
  },

  replaceHistory(path) {
    dispatch(createReplaceHistoryRouterAction(path));
  }
};
