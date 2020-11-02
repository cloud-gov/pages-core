const BuildLogs = require('./build-logs');

module.exports = {
  archiveBuildLogs: BuildLogs.archiveBuildLogs.bind(BuildLogs),
  archiveBuildLogsForBuildId: BuildLogs.archiveBuildLogsForBuildId.bind(BuildLogs),
  fetchBuildLogs: BuildLogs.fetchBuildLogs.bind(BuildLogs),
  getBuildLogs: BuildLogs.getBuildLogs.bind(BuildLogs),
};
