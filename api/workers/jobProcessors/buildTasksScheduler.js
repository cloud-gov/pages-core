const moment = require('moment');
const {
  SiteBuildTask, Site, Build, SiteBranchConfig,
} = require('../../models');
const { createJobLogger } = require('./utils');

async function buildTasksScheduler(job) {
  const logger = createJobLogger(job);

  const dayOfTheMonth = moment().date();

  logger.log(`Querying for all tasks which should run on this day of the month: ${dayOfTheMonth}`);

  const siteBuildTasks = await SiteBuildTask.findAll({
    where: {
      metadata: {
        runDay: dayOfTheMonth,
      },
    },
    include: {
      model: Site,
      include: SiteBranchConfig,
    },
  });

  logger.log(`Found ${siteBuildTasks.length} site build tasks.`);

  const tasksToQueue = await Promise.all(siteBuildTasks.map(async (siteBuildTask) => {
    // always use the branch config with site context
    const { branch } = siteBuildTask.Site.SiteBranchConfigs.find(sbc => sbc.context === 'site');
    // find the latest build matching this branch
    // https://github.com/sequelize/sequelize/issues/7665
    const builds = await Build.findAll({
      where: { site: siteBuildTask.Site.id, branch },
      limit: 1,
    });

    if (!builds.length) return Promise.resolve(null);

    return siteBuildTask.createBuildTask(builds[0]);
  }));

  logger.log(`Attempting to queue ${tasksToQueue.length} tasks`);

  await Promise.all(tasksToQueue.filter(Boolean).map(async (task) => {
    try {
      return task.enqueue();
    } catch (err) {
      logger.log(err);
      return false;
    }
  }));

  return true;
}

module.exports = buildTasksScheduler;
