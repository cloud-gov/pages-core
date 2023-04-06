const archiveBuildLogsDaily = require('./archiveBuildLogsDaily');
const destroySiteInfra = require('./destroySiteInfra');
const multiJobProcessor = require('./multiJobProcessor');
const nightlyBuilds = require('./nightlyBuilds');
const revokeMembershipForUAAUsers = require('./revokeMembershipForUAAUsers');
const timeoutBuilds = require('./timeoutBuilds');
const sandboxNotifications = require('./sandboxNotifications');
const cleanSandboxOrganizations = require('./cleanSandboxOrganizations');

module.exports = {
  archiveBuildLogsDaily,
  destroySiteInfra,
  multiJobProcessor,
  nightlyBuilds,
  revokeMembershipForUAAUsers,
  timeoutBuilds,
  sandboxNotifications,
  cleanSandboxOrganizations,
};
