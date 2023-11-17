const buildsFetchStartedType = 'BUILDS_FETCH_STARTED';
const buildsReceivedType = 'BUILDS_RECEIVED';
const buildFetchStartedType = 'BUILD_FETCH_STARTED';
const buildReceivedType = 'BUILD_RECEIVED';
const buildRestartedType = 'BUILD_RESTARTED';

const buildsFetchStarted = () => ({
  type: buildsFetchStartedType,
});

const buildsReceived = builds => ({
  type: buildsReceivedType,
  builds,
});

const buildFetchStarted = () => ({
  type: buildFetchStartedType,
});

const buildReceived = build => ({
  type: buildReceivedType,
  build,
});

const buildRestarted = build => ({
  type: buildRestartedType,
  build,
});

export {
  buildsFetchStarted, buildsFetchStartedType,
  buildsReceived, buildsReceivedType,
  buildFetchStarted, buildFetchStartedType,
  buildReceived, buildReceivedType,
  buildRestarted, buildRestartedType,
};
