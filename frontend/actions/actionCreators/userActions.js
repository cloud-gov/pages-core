const userFetchStartedType = 'USER_FETCH_STARTED';
const userReceivedType = 'USER_RECEIVED';

const userFetchStarted = () => ({
  type: userFetchStartedType,
});

const userReceived = user => ({
  type: userReceivedType,
  user,
});

export {
  userFetchStarted, userFetchStartedType,
  userReceived, userReceivedType,
};
