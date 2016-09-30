const buildsReceivedType = "BUILDS_RECEIVED";

const buildsReceived = builds => ({
  type: buildsReceivedType,
  builds
});

export {
  buildsReceived, buildsReceivedType
};
