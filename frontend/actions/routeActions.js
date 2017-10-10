import { dispatch } from '../store';
import {
  pushRouterHistory as createPushHistoryRouterAction,
  replaceRouterHistory as createReplaceHistoryRouterAction,
} from './actionCreators/navigationActions';

const pushHistory = (path) => {
  dispatch(createPushHistoryRouterAction(path));
};

const replaceHistory = (path) => {
  dispatch(createReplaceHistoryRouterAction(path));
};

export { pushHistory, replaceHistory };
