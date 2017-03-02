const buildsReceivedType = "BUILDS_RECEIVED";
const buildRestartedType = "BUILD_RESTARTED";

const buildsReceived = builds => ({
  type: buildsReceivedType,
  builds
});

const buildRestarted = build => ({
  type: buildRestartedType,
  build
});

export {
  buildsReceived, buildsReceivedType,
  buildRestarted, buildRestartedType,
};
