import federalist from '../util/federalistApi';
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

const dispatchUserReceivedAction = user =>
  dispatch(createUserReceivedAction(user));

const dispatchUserActionFetchStarted = () =>
  dispatch(createUserActionFetchStarted());

const dispatchUserActionReceived = userActions =>
  dispatch(createUserActionReceived(userActions));

export default {
  fetchUser() {
    dispatchUserFetchStartedAction();
    return federalist.fetchUser()
      .then(dispatchUserReceivedAction);
  },

  fetchUserActions(siteId) {
    dispatchUserActionFetchStarted();

    return federalist.fetchUserActions(siteId)
      .then(dispatchUserActionReceived);
  },
};
