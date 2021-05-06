const { logger } = require('../../winston');
const BullQueueClient = require('../utils/bullQueueClient');
const queues = require('./queues');

async function initializeQueue(queueName, { processJob, queueOptions, jobData = {} }) {
  const bullQueue = new BullQueueClient(queueName);
  await bullQueue.queue.empty();
  bullQueue.queue.process(async (job) => processJob(job.data));
  
  bullQueue.queue.on('completed', (job, result) => {
    logger.info(`COMPLETED: ${queueName} job@id=${job.id} completed! Result: ${result}`);
  });

  bullQueue.queue.on('failed', (job, err) => {
    logger.error(`FAILED: ${queueName} job@id=${job.id} failed! Error: ${err.stack}`);
  });

  await bullQueue.queue.add(jobData, queueOptions);
}

const queueNames = Object.keys(queues);
queueNames.forEach(queueName => {
  initializeQueue(queueName, queues[queueName])
});