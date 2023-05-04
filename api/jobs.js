const schedule = require('node-schedule');

const { logger } = require('../winston');

const SiteUserAuditor = require('./services/SiteUserAuditor');
const EventCreator = require('./services/EventCreator');
const { Event } = require('./models');

const { CF_INSTANCE_INDEX } = process.env;

function handleResults(results) {
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
  if (errors.length === 0) {
    return;
  }

  errors.forEach((error) => {
    EventCreator.error(Event.labels.SITE_USER, error);
    logger.error(error);
  });
}

function scheduleJobs() {
  if (CF_INSTANCE_INDEX === '0') {
    // audit users and remove sites w/o repo push permissions
    schedule.scheduleJob('15 0 * * *', () => {
      logger.info('Auditing All Sites');
      SiteUserAuditor.auditAllSites()
        .then(handleResults);
    });
  }
}

module.exports = scheduleJobs;
