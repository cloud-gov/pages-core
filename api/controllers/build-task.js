const { wrapHandlers } = require('../utils');
const {
  Build, BuildTask, BuildTaskType, SiteBuildTask,
} = require('../models');
const { getSignedTaskUrl, getTaskArtifactSize } = require('../services/S3BuildTask');
const buildTaskSerializer = require('../serializers/build-task');

module.exports = wrapHandlers({
  find: async (req, res) => {
    const { params, user } = req;
    const { build_id: buildId, build_task_id: buildTaskId } = params;

    // the build check essentially serves as an authorizer
    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const task = await BuildTask.findOne({
      where: { buildId, id: buildTaskId },
      include: BuildTaskType,
    });

    if (!task) {
      return res.notFound();
    }

    const taskJSON = buildTaskSerializer.serialize(task);

    return res.json(taskJSON);
  },

  list: async (req, res) => {
    const { params, user } = req;
    const { build_id: buildId } = params;

    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const tasks = await BuildTask.findAll({
      where: { buildId },
      include: BuildTaskType,
    });

    const updatedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.artifact) {
        const size = await getTaskArtifactSize(build.Site, task.artifact);
        const url = await getSignedTaskUrl(build.Site, task.artifact);
        // eslint-disable-next-line no-param-reassign
        task.artifact = { size, url };
      }
      return task;
    }));

    const tasksJSON = buildTaskSerializer.serializeMany(updatedTasks);

    return res.json(tasksJSON);
  },

  update: async (req, res) => {
    const { params, body } = req;
    const { build_task_id: buildTaskId, token } = params;
    const { Error, Success } = BuildTask.Statuses;

    const task = await BuildTask.findByPk(buildTaskId);

    if (!task) {
      return res.notFound();
    }
    if (task.token !== token || [Error, Success].includes(task.status)) {
      return res.forbidden();
    }

    await task.update(body);

    return res.ok();
  },

  createTasksForBuild: async (req, res) => {
    const { params, user } = req;
    const { build_id: buildId } = params;

    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const siteBuildTasks = await SiteBuildTask.findAll({
      where: {
        siteId: build.Site.id,
      },
    });

    await Promise.all(siteBuildTasks.map(siteBuildTask => (
      siteBuildTask
        .createBuildTask(build)
        .then(async task => task.enqueue())
    )));

    return res.ok({});
  },
});
