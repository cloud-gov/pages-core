const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { localSiteBuildTasks } = require('../../config');
const { wrapHandlers, appMatch } = require('../utils');
const {
  Build, BuildTask, BuildTaskType, SiteBuildTask, Site,
} = require('../models');
const buildTaskSerializer = require('../serializers/build-task');
const { getObject } = require('../services/S3BuildTask');

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

    const tasksJSON = buildTaskSerializer.serializeMany(tasks);

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

    await Promise.all(siteBuildTasks.map(siteBuildTask => (siteBuildTask
      .createBuildTask(build)
      .then(async task => task.enqueue())
    )));

    return res.ok({});
  },

  report: async (req, res) => {
    const { params, user } = req;
    const { task_id: taskId, sub_page: subPage } = params;

    const task = await BuildTask.findOne({
      where: { id: taskId },
      include: [
        BuildTaskType,
        SiteBuildTask,
        {
          model: Build,
          include: Site,
        }],
    });

    // the build check again serves as an authorizer
    const build = await Build.forSiteUser(user).findByPk(task?.Build?.id);

    if (!build || !task) {
      // return identical responses for missing tasks and unauthorized tasks
      return res.notFound();
    }
    const taskJSON = buildTaskSerializer.serialize(task);

    // add report data to the task
    let report = null;
    // for local seeded reports
    if (process.env.FEATURE_LOCAL_BUILD_REPORTS === 'active') {
      const localTask = localSiteBuildTasks.find(t => t.id.toString() === taskId);
      const file = subPage || 'index';
      const reportPath = join(
        __dirname,
        `../../services/local/tasks/${localTask.type}/${file}.json`
      );

      const raw = await readFile(reportPath, 'utf-8');
      report = JSON.parse(raw);
    } else {
      const key = `${task.artifact}${subPage || 'index'}.json`;
      const reportReponse = await getObject(task.Build.Site, key);
      const reportString = await reportReponse.Body.transformToString();
      report = JSON.parse(reportString);
    }

    const type = appMatch(task.BuildTaskType);

    const fullJSON = {
      ...taskJSON, report, type, siteId: task.Build.Site.id,
    };

    return res.json(fullJSON);
  },
});