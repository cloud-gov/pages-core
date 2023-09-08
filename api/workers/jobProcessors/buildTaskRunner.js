const {
  BuildTask, BuildTaskType, Build, Site,
} = require('../../models');
const arbitrary = require('./buildTasks/artibrary');
const gethtml = require('./buildTasks/gethtml');
const { createJobLogger } = require('./utils');
const { S3Client } = require('../../services/S3Helper');

async function buildTaskRunner(job) {
  const logger = createJobLogger(job);
  const taskId = job.data.TASK_ID;

  logger.log(`Running build task id: ${taskId}`);
  try {
    const s3Client = new S3Client({
      accessKeyId: job.data.AWS_ACCESS_KEY_ID,
      secretAccessKey: job.data.AWS_SECRET_ACCESS_KEY,
      region: job.data.AWS_DEFAULT_REGION,
      bucket: job.data.BUCKET,
    });

    const callbackUrl = job.data.STATUS_CALLBACK;

    const task = await BuildTask.findByPk(taskId, {
      include: [
        { model: BuildTaskType, required: true },
        { model: Build, required: true, include: [{ model: Site, required: true }] },
      ],
    });

    const taskTypeName = task.BuildTaskType.name;
    switch (taskTypeName) {
      case 'test':
        return arbitrary(task, logger, s3Client, callbackUrl);
      case 'another test':
        return gethtml(task, logger, s3Client, callbackUrl);
      default:
        logger.log(`Unknown task type: ${taskTypeName}`);
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
