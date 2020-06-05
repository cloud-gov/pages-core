const schedule = require('node-schedule');

const { logger } = require('../winston');
const config = require('../config');

const FederalistUsersHelper = require('./services/FederalistUsersHelper');
const RepositoryVerifier = require('./services/RepositoryVerifier');
const SiteUserAuditor = require('./services/SiteUserAuditor');
const ScheduledBuildHelper = require('./services/ScheduledBuildHelper');

const { CF_INSTANCE_INDEX } = process.env;

const { app: { app_env: appEnv } } = config;

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
        .catch(logger.error);
    });

    if (appEnv === 'production') {
      // audit federalist-users 18F teams daily at midnight
      schedule.scheduleJob('20 0 * * *', () => {
        logger.info('Auditing federalist-users 18F Staff & Org Teams');
        FederalistUsersHelper.audit18F({})
          .catch(logger.error);
      });

      // audit federalist-users 18F teams daily at midnight
      schedule.scheduleJob('0 0 * * *', () => {
        logger.info('Running nightlyBuilds');
        ScheduledBuildHelper.nightlyBuilds()
          .catch(logger.error);
      });
    }
  }
}

module.exports = scheduleJobs;
