const archiveBuildLogsDaily = require('./archiveBuildLogsDaily');
const nightlyBuilds = require('./nightlyBuilds');
const revokeMembershipForInactiveUsers = require('./revokeMembershipForInactiveUsers');
const timeoutBuilds = require('./timeoutBuilds');
const verifyRepositories = require('./verifyRepositories');

module.exports = {
  archiveBuildLogsDaily,
  nightlyBuilds,
  revokeMembershipForInactiveUsers,
  timeoutBuilds,
  verifyRepositories,
};
