import federalist from '../util/federalistApi';
import alertActions from './alertActions';
import { dispatch } from '../store';
import {
  userFetchStarted as createUserFetchStartedAction,
  userReceived as createUserReceivedAction,
  userActionFetchStarted as createUserActionFetchStarted,
  userActionReceived as createUserActionReceived,
} from './actionCreators/userActions';

const dispatchUserFetchStartedAction = () => {
  dispatch(createUserFetchStartedAction());
};

const dispatchUserReceivedAction = (user) => dispatch(createUserReceivedAction(user));

const dispatchUserActionFetchStarted = () => dispatch(createUserActionFetchStarted());

const dispatchUserActionReceived = (userActions) =>
  dispatch(createUserActionReceived(userActions));

const alertError = (error) => {
  window.scrollTo(0, 0);
  alertActions.httpError(error.message);
};

export default {
  fetchUser() {
    dispatchUserFetchStartedAction();
    return federalist.fetchUser().then(dispatchUserReceivedAction).catch(alertError);
  },

  fetchUserActions(siteId) {
    dispatchUserActionFetchStarted();

    return federalist.fetchUserActions(siteId).then(dispatchUserActionReceived);
  },
};
