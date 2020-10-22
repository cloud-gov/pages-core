/* eslint-disable no-console */
const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const { Op } = require('sequelize');
const { Build } = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

async function runArchiveBuildLogsDaily(date) {
  const startDate = date.clone();
  const endDate = startDate.clone().add(1, 'days');

  const builds = await Build.findAll({
    attributes: ['id'],
    where: {
      completedAt: {
        [Op.gte]: startDate.toDate(),
        [Op.lt]: endDate.toDate(),
      },
    },
  });

  const { errors } = await PromisePool
    .withConcurrency(5)
    .for(builds)
    .process(({ id }) => BuildLogs.archiveBuildLogsForBuildId(id));

  return { builds, errors };
}

/**
 * Archive all build logs for the previous 180 days
 *
 * @param {string} startDateStr - 'YYYY-MM-dd'
 */
async function runMigrateBuildLogs(startDateStr) {
  try {
    const startDate = moment(startDateStr);

    let totalResults = 0;
    let totalErrors = 0;

    // eslint-disable-next-line no-plusplus
    for (let n = 1; n <= 180; n++) {
      const date = startDate.clone().substract(n, 'days');
      console.log(`\nArchiving build logs for ${date}`);

      // eslint-disable-next-line no-await-in-loop
      const { results, errors } = await runArchiveBuildLogsDaily(date);
      console.log(`  Success: ${results.length - errors.length} Failure: ${errors.length}`);
      totalResults += results.length;
      totalErrors += errors.length;
    }

    console.log(`Build log migration complete with ${totalResults - totalErrors} successes and ${totalErrors} errors.`);

    if (totalErrors > 0) {
      console.error('Not all build logs were archived successfully, see above for details.');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const startDateStr = process.argv[2];
if (!startDateStr) {
  console.error('\nMissing required argument `startDateStr` in format "YYYY-MM-dd"\n');
  process.exit(1);
}
runMigrateBuildLogs(startDateStr);
