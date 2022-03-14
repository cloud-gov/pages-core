const moment = require('moment');
const { Op } = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const BuildLogs = require('../../services/build-logs');
const { Build } = require('../../models');

function createJobLogger(job) {
  let logs = [];
  return {
    log(msg) {
      logs.push(job.log(msg));
    },
    async flush() {
      await Promise.all(logs);
      logs = [];
    },
  };
}

async function archiveBuildLogsDaily(job) {
  const logger = createJobLogger(job);

  const startDate = moment().subtract(1, 'days').startOf('day');
  const endDate = startDate.clone().add(1, 'days');

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

  const errMsg = [
    `Archive build logs for ${startDate.format('YYYY-MM-DD')} completed with the following errors:`,
    errors.map(e => `  ${e.item.id}: ${e.message}`).join('\n'),
  ].join();
  logger.log(errMsg);
  await logger.flush();
  throw new Error(errMsg);
}

module.exports = archiveBuildLogsDaily;
