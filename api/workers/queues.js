const moment = require('moment');

const { nightlyBuilds } = require('../services/ScheduledBuildHelper');
const { revokeMembershipForInactiveUsers } = require('../services/FederalistUsersHelper');
const timeoutBuilds = require('../services/TimeoutBuilds');
const BuildLogs = require('../services/build-logs');

const NIGHTLY = '* * * *  *'; // '0 5 * * *';
const EVERY_TEN_MINUTES = '* * * * *'; // '0,10,20,30,40,50 * * * *';

module.exports = {
  nightlyBuilds: {
    queueOptions: { repeat: { cron: NIGHTLY } },
    processJob: nightlyBuilds,
  },
  removeInactiveFederalistUsers: {
    queueOptions: { repeat: { cron: NIGHTLY } },
    processJob: revokeMembershipForInactiveUsers,
  },
  timeoutBuilds: {
    queueOptions: { repeat: { cron: EVERY_TEN_MINUTES } },
    processJob: timeoutBuilds,
  },
  archiveBuildLogs: {
    queueOptions: { repeat: { cron: EVERY_TEN_MINUTES } },
    processJob: async () => {
      const startDate = moment().subtract(1, 'days');
      const endDate = startDate.clone().add(1, 'days');
      return BuildLogs.archiveBuildLogsByDate(startDate.toDate(), endDate.toDate());
    },
  },
};
