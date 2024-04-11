const {
  BuildTask, BuildTaskType, Build, Site,
} = require('../../models');
const { createJobLogger } = require('./utils');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');

// Add CF Task (startBuildTask method) call to retry sleep interval to 1 second
// If it is in test environment set to 0 seconds
const sleepInterval = process.env.NODE_ENV === 'test' ? 0 : 1000;

async function buildTaskRunner(
  job,
  { sleepNumber = 15000, totalAttempts = 240 } = {}
) {
  const logger = createJobLogger(job);
  const taskId = job.data.TASK_ID;

  logger.log(`Running build task id: ${taskId}`);
  try {
    const task = await BuildTask.findByPk(taskId, {
      include: [
        { model: BuildTaskType, required: true },
        {
          model: Build,
          required: true,
          include: [{ model: Site, required: true }],
        },
      ],
      raw: true,
      nest: true,
    });

    const taskTypeRunner = task.BuildTaskType.runner;
    const { branch, Site: site } = task.Build;
    const { owner, repository } = site;
    const apiClient = new CloudFoundryAPIClient();

    let cfResponse;

    if (taskTypeRunner === BuildTaskType.Runners.Cf_task) {
      try {
        logger.log(`Starting ${taskTypeRunner} for ${owner}/${repository} on branch ${branch}`);

        cfResponse = await apiClient.startBuildTask(task, job, { sleepInterval });

        if (cfResponse.state === 'FAILED') {
          logger.log(`CF task failed for ${taskTypeRunner} ${taskId}`);
          throw new Error(`CF task failed for ${taskTypeRunner} ${taskId}`);
        }

        logger.log(`The ${taskTypeRunner} started successfully.`);
      } catch (error) {
        const message = `Error build task ${taskTypeRunner} ${taskId}: ${error}`;

        logger.log(message);
        throw new Error(message);
      }

      logger.log('Waiting for build status update.');
      const hasCompleted = await apiClient.pollTaskStatus(cfResponse.guid, {
        sleepInterval: sleepNumber,
        totalAttempts,
      });

      if (hasCompleted.state === 'FAILED') {
        // Make sure to error task if CF Task failed
        const failedTask = await BuildTask.findByPk(taskId);

        // Check for any status that hasn't completed
        if (
          [
            BuildTask.Statuses.Processing,
            BuildTask.Statuses.Queued,
            BuildTask.Statuses.Created,
          ].includes(failedTask.status)
        ) {
          await failedTask.update({ status: BuildTask.Statuses.Error });
        }
      }

      logger.log(
        JSON.stringify({
          state: hasCompleted.state,
          id: task.id,
          type: task.BuildTaskType.name,
        })
      );

      return true;
    }

    if (taskTypeRunner === BuildTaskType.Runners.Worker) {
      // TODO: Add worker based runner
      return true;
    }

    logger.log(`Unknown task runner ${taskId}: ${taskTypeRunner}`);
    throw new Error(`Unknown task runner ${taskId}: ${taskTypeRunner}`);
  } catch (err) {
    // TODO: should this hit the update endpoint instead?
    logger.log(`An error occured: ${err?.message}`);
    const errorTask = await BuildTask.findByPk(taskId);
    await errorTask.update({ status: BuildTask.Statuses.Error, message: err?.message });
    throw err;
  }
}

module.exports = buildTaskRunner;
