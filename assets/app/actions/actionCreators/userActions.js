import { userActionTypes as types } from '../../constants';

const userReceivedType = types.USER_RECEIVED;
const userLogoutType = types.USER_LOGOUT;

const userReceived = user => ({
  type: userReceivedType,
  user
});

const userLogout = () => ({
  type: userLogoutType
});

export {
  userReceived, userReceivedType,
  userLogout, userLogoutType
};
