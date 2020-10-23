/* eslint-disable no-console */
const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const { Op } = require('sequelize');
const { Build } = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

/**
 * Archive build logs for all builds that completed on the provided date
 *
 * @param {string} dateStr - 'YYYY-MM-dd'
 */
async function runArchiveBuildLogsDaily(dateStr) {
  try {
    const startDate = moment(dateStr);
    const endDate = startDate.clone().add(1, 'days');

    console.log(`\nQuerying for all builds completed between ${startDate} and ${endDate}.`);

    const builds = await Build.findAll({
      attributes: ['id'],
      where: {
        completedAt: {
          [Op.gte]: startDate.toDate(),
          [Op.lt]: endDate.toDate(),
        },
      },
    });

    console.log(`\nFound ${builds.length} builds.`);

    const { errors } = await PromisePool
      .withConcurrency(5)
      .for(builds)
      .process(({ id }) => BuildLogs.archiveBuildLogsForBuildId(id));

    if (errors.length === 0) {
      console.log('\nAll build logs archived successfully!');
      process.exit(0);
    }

    console.error(`\nArchive build logs for ${dateStr} completed with the following errors:`);
    console.error(errors.map(e => `  ${e.item.id}: ${e.message}`).join('\n'));
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

let dateStr = process.argv[2];
if (!dateStr) {
  dateStr = moment().subtract(1, 'days').format('YYYY-MM-DD');
  console.log(`\nNo date provided, using the previous date ${dateStr}\n`);
}
runArchiveBuildLogsDaily(dateStr);
