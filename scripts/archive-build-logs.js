/* eslint-disable no-console */
const { Build, Site } = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

async function runArchiveBuildLogs(buildId) {
  try {
    const build = await Build.findOne({
      where: { id: buildId },
      include: [{
        model: Site,
        required: true,
      }],
    });
    await BuildLogs.archiveBuildLogs(build.Site, build);
    console.log('Success!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const buildId = parseInt(process.argv[2], 10);
runArchiveBuildLogs(buildId);
