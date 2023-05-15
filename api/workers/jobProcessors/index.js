const archiveBuildLogsDaily = require('./archiveBuildLogsDaily');
const destroySiteInfra = require('./destroySiteInfra');
const failStuckBuilds = require('./failStuckBuilds');
const multiJobProcessor = require('./multiJobProcessor');
const nightlyBuilds = require('./nightlyBuilds');
const timeoutBuilds = require('./timeoutBuilds');
const sandboxNotifications = require('./sandboxNotifications');
const cleanSandboxOrganizations = require('./cleanSandboxOrganizations');

module.exports = {
  archiveBuildLogsDaily,
  destroySiteInfra,
  failStuckBuilds,
  multiJobProcessor,
  nightlyBuilds,
  timeoutBuilds,
  sandboxNotifications,
  cleanSandboxOrganizations,
};
