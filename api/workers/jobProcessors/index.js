const archiveBuildLogsDaily = require('./archiveBuildLogsDaily');
const multiJobProcessor = require('./multiJobProcessor');
const nightlyBuilds = require('./nightlyBuilds');
const revokeMembershipForInactiveUsers = require('./revokeMembershipForInactiveUsers');
const timeoutBuilds = require('./timeoutBuilds');
const verifyRepositories = require('./verifyRepositories');

module.exports = {
  archiveBuildLogsDaily,
  multiJobProcessor,
  nightlyBuilds,
  revokeMembershipForInactiveUsers,
  timeoutBuilds,
  verifyRepositories,
};
