const buildLogsFetchStartedType = "BUILD_LOGS_FETCH_STARTED"
const buildLogsReceivedType = "BUILD_LOGS_RECEIVED";

const buildLogsFetchStarted = () => ({
  type: buildLogsFetchStartedType,
})

const buildLogsReceived = logs => ({
  type: buildLogsReceivedType,
  logs,
});

export {
  buildLogsFetchStartedType, buildLogsFetchStarted,
  buildLogsReceivedType, buildLogsReceived,
}
