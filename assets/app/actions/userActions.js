import federalist from '../util/federalistApi';
import { dispatch } from '../store';
import {
  userReceived as createUserReceivedAction,
  userLogout as createUserLogoutAction
} from "./actionCreators/userActions";

const dispatchUserReceivedAction = user => {
  dispatch(createUserReceivedAction(user));
};

export default {
  fetchUser() {
    return federalist.fetchUser()
      .then(dispatchUserReceivedAction);
  },

  logout() {
    dispatch(createUserLogoutAction());
  }
};
