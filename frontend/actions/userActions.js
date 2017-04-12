import federalist from '../util/federalistApi';
import { dispatch } from '../store';
import {
  userFetchStarted as createUserFetchStartedAction,
  userReceived as createUserReceivedAction,
} from "./actionCreators/userActions";

const dispatchUserFetchStartedAction = () => {
  dispatch(createUserFetchStartedAction())
}

const dispatchUserReceivedAction = user => {
  dispatch(createUserReceivedAction(user));
};

export default {
  fetchUser() {
    dispatchUserFetchStartedAction
    return federalist.fetchUser()
      .then(dispatchUserReceivedAction)
  },
};
