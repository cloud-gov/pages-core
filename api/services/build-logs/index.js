const BuildLogs = require('./build-logs');

module.exports = {
  archiveBuildLogs: BuildLogs.archiveBuildLogs.bind(BuildLogs),
  getBuildLogs: BuildLogs.getBuildLogs.bind(BuildLogs),
};
