const buildLogsFetchStartedType = 'BUILD_LOGS_FETCH_STARTED';
const buildLogsReceivedType = 'BUILD_LOGS_RECEIVED';

const buildLogsFetchStarted = () => ({
  type: buildLogsFetchStartedType,
});

const buildLogsReceived = ({ logs, page }) => ({
  type: buildLogsReceivedType,
  logs,
  page,
});

export {
  buildLogsFetchStartedType, buildLogsFetchStarted,
  buildLogsReceivedType, buildLogsReceived,
};
