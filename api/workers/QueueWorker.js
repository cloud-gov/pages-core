const { Worker } = require('bullmq');

const { logger } = require('../../winston');

class QueueWorker extends Worker {
  constructor(queueName, connection, processor, { concurrency = 5 } = { concurrency: 5 }) {
    super(queueName, processor, { connection, concurrency });

    this.on('error', (err) => {
      logger.error(`Worker Error on '${queueName}' Queue:`, err);
    });

    this.on('completed', (job) => {
      logger.info(`Job Complete on '${queueName}' Queue: ${job.toJSON()}`);
    });

    this.on('failed', (job, failedReason) => {
      logger.error(`Job Failed on '${queueName}' Queue: ${job.toJSON()}`, failedReason);
    });
  }
}

module.exports = QueueWorker;
