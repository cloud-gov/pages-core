const buildLogsReceivedType = "BUILD_LOGS_RECEIVED";

const buildLogsReceived = logs => ({
  type: buildLogsReceivedType,
  logs,
});

export {
  buildLogsReceivedType, buildLogsReceived,
}
