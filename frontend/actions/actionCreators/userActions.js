const userFetchStartedType = 'USER_FETCH_STARTED';
const userReceivedType = 'USER_RECEIVED';
const userActionFetchStartedType = 'USER_ACTIONS_FETCH_STARTED';
const userActionReceivedType = 'USER_ACTIONS_RECEIVED';
const userSettingsUpdatedType = 'USER_SETTINGS_UPDATED';

const userFetchStarted = () => ({
  type: userFetchStartedType,
});

const userReceived = user => ({
  type: userReceivedType,
  user,
});

const userActionFetchStarted = () => ({
  type: userActionFetchStartedType,
});

const userActionReceived = userActions => ({
  type: userActionReceivedType,
  userActions,
});

const userSettingsUpdated = user => ({
  type: userSettingsUpdatedType,
  user,
});

export {
  userFetchStarted, userFetchStartedType,
  userReceived, userReceivedType,
  userActionFetchStarted, userActionFetchStartedType,
  userActionReceived, userActionReceivedType,
  userSettingsUpdated, userSettingsUpdatedType,
};
