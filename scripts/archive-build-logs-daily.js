/* eslint-disable no-console */
const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const { Op } = require('sequelize');
const { Build, Site } = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

async function archiveBuildLogs({ id }) {
  const build = await Build.findOne({
    where: { id },
    include: [{
      model: Site,
      required: true,
    }],
  });
  return BuildLogs.archiveBuildLogs(build.Site, build);
}

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

    // Let's do 5 at a time
    const { errors } = await PromisePool
      .withConcurrency(5)
      .for(builds)
      .process(archiveBuildLogs);

    if (errors.length === 0) {
      console.log('\nAll build logs archived successfully!');
      process.exit(0);
    }

    console.error(`\nArchive build logs for ${dateStr}completed with the following errors:`);
    console.error(errors.map(e => `  ${e.item.id}: ${e.message}`).join('\n'));
    process.exit(1);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const dateStr = process.argv[2];
if (!dateStr) {
  console.error('\nMissing required argument `dateStr` in format "YYYY-MM-dd"\n');
  process.exit(1);
}
runArchiveBuildLogsDaily(dateStr);
