const moment = require('moment');
const {
  SiteBuildTasks, Site, Build, SiteBranchConfig, Domain,
} = require('../../models');
const { createJobLogger } = require('./utils');

async function buildTasksScheduler(job) {
  const logger = createJobLogger(job);

  const dayOfTheMonth = moment.now().date();
  logger.log(`Querying for all tasks which should run on this day of the month: ${dayOfTheMonth}`);

  const siteBuildTasks = await SiteBuildTasks.findAll({
    where: {
      metadata: {
        runDay: dayOfTheMonth,
      },
    },
    include: {
      model: Site,
      include: {
        model: SiteBranchConfig,
        include: Domain,
      },
    },
  });

  logger.log(`Found ${siteBuildTasks.length} site build tasks.`);

  const tasksToQueue = await Promise.all(siteBuildTasks.flatMap(async (siteBuildTask) => {
    // always use the branch config with site context
    const { branch } = siteBuildTask.Site.SiteBranchConfigs.find(sbc => sbc.context === 'site');
    // find the latest build matching this branch
    const build = await Build.findOne({ site: siteBuildTask.Site.id, branch });

    if (!build) return Promise.resolve(null);

    // TODO: there's some confusion because this returns an array and we use .flatMap
    // but I think this should always return a single task
    return siteBuildTask.createBuildTasks({ build });
  })).filter(Boolean);

  logger.log(`Attempting to queue ${tasksToQueue.length} tasks`);

  await Promise.all(tasksToQueue.map(async (task) => {
    try {
      return task.enqueue();
    } catch (err) {
      logger.log(err);
      return false;
    }
  }));
}

module.exports = buildTasksScheduler;
