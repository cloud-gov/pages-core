const buildsFetchStartedType = 'BUILDS_FETCH_STARTED';
const buildsReceivedType = 'BUILDS_RECEIVED';
const buildRestartedType = 'BUILD_RESTARTED';

const buildsFetchStarted = () => ({
  type: buildsFetchStartedType,
});

const buildsReceived = builds => ({
  type: buildsReceivedType,
  builds,
});

const buildRestarted = build => ({
  type: buildRestartedType,
  build,
});

export {
  buildsFetchStarted, buildsFetchStartedType,
  buildsReceived, buildsReceivedType,
  buildRestarted, buildRestartedType,
};
