const { logger } = require('../../winston');
const BullQueueClient = require('../utils/bullQueueClient');

async function initialize(queueName, { processJob, queueOptions, jobData = {} }) {
  const bullQueue = new BullQueueClient(queueName);
  await bullQueue.queue.empty();
  bullQueue.queue.process(async (job) => processJob(job.data));
  
  bullQueue.queue.on('completed', (job, result) => {
    logger.info(`COMPLETED: ${queueName} job@id=${job.id} completed! Result: ${result}`);
  });

  bullQueue.queue.on('failed', (job, err) => {
    logger.error(`FAILED: ${queueName} job@id=${job.id} failed! Error: ${err.stack}`);
  });

  bullQueue.queue.on('cleaned', function(jobs, type) {
    logger.info('Cleaned %s %s jobs', jobs.length, type);
  });

  await bullQueue.queue.add(jobData, queueOptions);
  return bullQueue;
}

module.exports = { initialize };