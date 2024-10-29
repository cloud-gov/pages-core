const userEnvironmentVariablesFetchStartedType =
  'USER_ENVIRONMENT_VARIABLES_FETCH_STARTED';
const userEnvironmentVariablesReceivedType = 'USER_ENVIRONMENT_VARIABLES_RECEIVED';
const userEnvironmentVariableAddedType = 'USER_ENVIRONMENT_VARIABLE_ADDED';
const userEnvironmentVariableDeletedType = 'USER_ENVIRONMENT_VARIABLE_DELETED';

const userEnvironmentVariablesFetchStarted = (siteId) => ({
  type: userEnvironmentVariablesFetchStartedType,
  payload: { siteId },
});

const userEnvironmentVariablesReceived = (siteId, userEnvironmentVariables) => ({
  type: userEnvironmentVariablesReceivedType,
  payload: {
    siteId,
    userEnvironmentVariables,
  },
});

const userEnvironmentVariableAdded = (siteId, userEnvironmentVariable) => ({
  type: userEnvironmentVariableAddedType,
  payload: {
    siteId,
    userEnvironmentVariable,
  },
});

const userEnvironmentVariableDeleted = (siteId, userEnvironmentVariableId) => ({
  type: userEnvironmentVariableDeletedType,
  payload: {
    siteId,
    userEnvironmentVariableId,
  },
});

export {
  userEnvironmentVariablesFetchStarted,
  userEnvironmentVariablesFetchStartedType,
  userEnvironmentVariablesReceived,
  userEnvironmentVariablesReceivedType,
  userEnvironmentVariableAdded,
  userEnvironmentVariableAddedType,
  userEnvironmentVariableDeleted,
  userEnvironmentVariableDeletedType,
};
