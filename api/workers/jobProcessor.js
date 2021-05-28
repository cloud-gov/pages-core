const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const { Op } = require('sequelize');
const { Build } = require('../models');
const TimeoutBuilds = require('../services/TimeoutBuilds');
const ScheduledBuildHelper = require('../services/ScheduledBuildHelper');
const RepositoryVerifier = require('../services/RepositoryVerifier');
const BuildLogs = require('../services/build-logs');
const FederalistUsersHelper = require('../services/FederalistUsersHelper');
const { logger } = require('../../winston');

async function runTimeoutBuilds() {
  const results = await TimeoutBuilds.timeoutBuilds();
  const allBuildIds = results.map(r => r[0]);
  logger.info(`${results.length} total builds timed out: [${allBuildIds.join(', ')}]`);

  const failedCancels = results.filter(([, result]) => result.status === 'rejected');

  if (failedCancels.length === 0) {
    return;
  }

  const details = failedCancels.map(([buildId, { reason }]) => `${buildId}: ${reason}`).join('\n');
  throw new Error(`${failedCancels.length} build tasks could not be canceled:\n${details}`);
}

async function runArchiveBuildLogsDaily() {
  const startDate = moment().subtract(1, 'days').startOf('day');
  const endDate = startDate.clone().add(1, 'days');

  logger.info(`Querying for all builds completed between ${startDate} and ${endDate}.`);

  const builds = await Build.findAll({
    attributes: ['id'],
    where: {
      completedAt: {
        [Op.gte]: startDate.toDate(),
        [Op.lt]: endDate.toDate(),
      },
    },
  });

  logger.info(`Found ${builds.length} builds.`);

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(builds)
    .process(({ id }) => BuildLogs.archiveBuildLogsForBuildId(id));

  if (errors.length === 0) {
    logger.info('All build logs archived successfully!');
    return;
  }

  const errMsg = [
    `Archive build logs for ${startDate.format('YYYY-MM-DD')} completed with the following errors:`,
    errors.map(e => `  ${e.item.id}: ${e.message}`).join('\n'),
  ].join();
  logger.error(errMsg);
  throw new Error(errMsg);
}

async function runNightlyBuilds() {
  const results = await ScheduledBuildHelper.nightlyBuilds();

  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Queued nightly builds with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed build errors.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

async function runVerifyRepos() {
  const results = await RepositoryVerifier.verifyRepos();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Repositories verified with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed repository verifications.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

async function runRevokeMembershipForInactiveUsers() {
  const results = await FederalistUsersHelper.revokeMembershipForInactiveUsers();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results.filter(r => r.status === 'rejected')
    .map(r => r.reason);

  const msg = [`Invactive federalist-users removed with ${successes.length} successes and ${failures.length} failures.`];

  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = {
  runArchiveBuildLogsDaily,
  runNightlyBuilds,
  runTimeoutBuilds,
  runVerifyRepos,
  runRevokeMembershipForInactiveUsers,
};
