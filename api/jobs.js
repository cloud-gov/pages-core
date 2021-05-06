const schedule = require('node-schedule');

const { logger } = require('../winston');
const config = require('../config');

const FederalistUsersHelper = require('./services/FederalistUsersHelper');
const RepositoryVerifier = require('./services/RepositoryVerifier');
const SiteUserAuditor = require('./services/SiteUserAuditor');
const EventCreator = require('./services/EventCreator');
const { Event } = require('./models');

const { CF_INSTANCE_INDEX } = process.env;

const { app: { app_env: appEnv } } = config;

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
    // verify site's repositories exist
    schedule.scheduleJob('10 0 * * *', () => {
      logger.info('Verifying Repos');
      RepositoryVerifier.verifyRepos()
        .catch(logger.error);
    });

    // audit users and remove sites w/o repo push permissions
    schedule.scheduleJob('15 0 * * *', () => {
      logger.info('Auditing All Sites');
      SiteUserAuditor.auditAllSites()
        .then(handleResults);
    });

    if (appEnv === 'production') {
      // audit federalist-users 18F teams daily at midnight
      schedule.scheduleJob('20 0 * * *', () => {
        logger.info('Auditing federalist-users 18F Staff & Org Teams');
        FederalistUsersHelper.audit18F()
          .catch(logger.error);
      });
    }
  }
}

module.exports = scheduleJobs;
