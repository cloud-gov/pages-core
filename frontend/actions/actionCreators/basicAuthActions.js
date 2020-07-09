const basicAuthFetchStartedType = 'BASIC_AUTH_FETCH_STARTED';
const basicAuthReceivedType = 'BASIC_AUTH_RECEIVED';
const basicAuthSavedType = 'BASIC_AUTH_ADDED';
const basicAuthRemovedType = 'BASIC_AUTH_DELETED';

const basicAuthFetchStarted = siteId => ({
  type: basicAuthFetchStartedType,
  payload: { siteId },
});

const basicAuthReceived = (siteId, basicAuth) => ({
  type: basicAuthReceivedType,
  payload: { siteId, basicAuth },
});

const basicAuthSaved = (siteId, basicAuth) => ({
  type: basicAuthSavedType,
  payload: { siteId, basicAuth },
});

const basicAuthRemoved = siteId => ({
  type: basicAuthRemovedType,
  payload: { siteId },
});

export {
  basicAuthFetchStarted, basicAuthFetchStartedType,
  basicAuthReceived, basicAuthReceivedType,
  basicAuthSaved, basicAuthSavedType,
  basicAuthRemoved, basicAuthRemovedType,
};
