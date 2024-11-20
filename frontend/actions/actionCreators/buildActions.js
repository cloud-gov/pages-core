const buildRestartedType = 'BUILD_RESTARTED';

const buildRestarted = (build) => ({
  type: buildRestartedType,
  build,
});

export { buildRestarted, buildRestartedType };
