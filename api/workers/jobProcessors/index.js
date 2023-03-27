const archiveBuildLogsDaily = require('./archiveBuildLogsDaily');
const destroySiteInfra = require('./destroySiteInfra');
const multiJobProcessor = require('./multiJobProcessor');
const nightlyBuilds = require('./nightlyBuilds');
const revokeMembershipForInactiveUsers = require('./revokeMembershipForInactiveUsers');
const revokeMembershipForUAAUsers = require('./revokeMembershipForUAAUsers');
const timeoutBuilds = require('./timeoutBuilds');
const verifyRepositories = require('./verifyRepositories');
const sandboxNotifications = require('./sandboxNotifications');
const cleanSandboxOrganizations = require('./cleanSandboxOrganizations');

module.exports = {
  archiveBuildLogsDaily,
  destroySiteInfra,
  multiJobProcessor,
  nightlyBuilds,
  revokeMembershipForInactiveUsers,
  revokeMembershipForUAAUsers,
  timeoutBuilds,
  verifyRepositories,
  sandboxNotifications,
  cleanSandboxOrganizations,
};
