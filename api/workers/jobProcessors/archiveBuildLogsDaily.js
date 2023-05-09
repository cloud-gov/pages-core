const moment = require('moment');
const { Op } = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const BuildLogs = require('../../services/build-logs');
const { Build } = require('../../models');
const Mailer = require('../../services/mailer');
const Slacker = require('../../services/slacker');
const { createJobLogger } = require('./utils');

async function archiveBuildLogsDaily(job) {
  const logger = createJobLogger(job);
  // our daily job uses a three day window to check for previous logs in case of failure
  const startDate = moment().subtract(3, 'days').startOf('day');
  const endDate = startDate.clone().add(3, 'days');

  logger.log(`Querying for all builds completed between ${startDate} and ${endDate}.`);

  const builds = await Build.findAll({
    attributes: ['id'],
    where: {
      completedAt: {
        [Op.gte]: startDate.toDate(),
        [Op.lt]: endDate.toDate(),
      },
    },
  });

  logger.log(`Found ${builds.length} builds.`);

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(builds)
    .process(({ id }) => BuildLogs.archiveBuildLogsForBuildId(id));

  if (errors.length === 0) {
    logger.log('All build logs archived successfully!');
    await logger.flush();
    return 'Ok';
  }

  const errMsg = `Archive build logs for ${startDate.format('YYYY-MM-DD')} - ${endDate.format('YYYY-MM-DD')} completed with errors`;
  logger.log(errMsg);
  await logger.flush();

  Mailer.init();
  Slacker.init();
  Mailer.sendAlert(errMsg, errors);
  Slacker.sendAlert(errMsg, errors);

  throw new Error(errMsg);
}

module.exports = archiveBuildLogsDaily;
