const {
  BuildTask, BuildTaskType, Build, Site,
} = require('../../models');

const { createJobLogger } = require('./utils');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');

async function buildTaskRunner(job) {
  const logger = createJobLogger(job);
  const taskId = job.data.TASK_ID;

  logger.log(`Running build task id: ${taskId}`);
  try {
    const task = await BuildTask.findByPk(taskId, {
      include: [
        { model: BuildTaskType, required: true },
        { model: Build, required: true, include: [{ model: Site, required: true }] },
      ],
      raw: true,
      nest: true,
    });

    const taskTypeRunner = task.BuildTaskType.runner;
    const apiClient = new CloudFoundryAPIClient();
    switch (taskTypeRunner) {
      case BuildTaskType.Runners.Cf_task:
        await apiClient.startBuildTask(task, job);
        return true;
      case BuildTaskType.Runners.Worker:
        // TODO: temporary switch for JS worker code
        return true;
      default:
        logger.log(`Unknown task runner: ${taskTypeRunner}`);
        return true;
    }
  } catch (err) {
    logger.log(err);
    // TODO: should this hit the update endpoint instead?
    const errorTask = await BuildTask.findByPk(taskId);
    await errorTask.update({ status: 'error' });
    return err;
  }
}

module.exports = buildTaskRunner;
