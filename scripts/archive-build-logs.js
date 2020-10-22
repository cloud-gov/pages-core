/* eslint-disable no-console */
const BuildLogs = require('../api/services/build-logs');

async function runArchiveBuildLogs(buildId) {
  try {
    await BuildLogs.archiveBuildLogsForBuildId(buildId);
    console.log('Success!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const buildId = parseInt(process.argv[2], 10);
runArchiveBuildLogs(buildId);
