const userReceivedType = "USER_RECEIVED";
const userLogoutType = "USER_LOGOUT";

const userReceived = user => ({
  type: userReceivedType,
  user
});

// FIXME: nobody appears to listen to this-- should we drop it?
const userLogout = () => ({
  type: userLogoutType
});

export {
  userReceived, userReceivedType,
  userLogout, userLogoutType
};
