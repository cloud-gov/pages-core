const { Worker } = require('bullmq');

const { logger } = require('../../winston');

class QueueWorker extends Worker {
  constructor(queueName, connection, processor, { concurrency = 5 } = { concurrency: 5 }) {
    super(queueName, processor, { connection, concurrency });

    this.on('error', (err) => {
      logger.error(`Worker Error - Queue: '${queueName}'`, err);
    });

    this.on('completed', (job) => {
      logger.info(`Job Complete - Queue: '${queueName}' Job: '${job.name}'`);
    });

    this.on('failed', (job, failedReason) => {
      logger.error(`Job Failed - Queue: '${queueName}' Job: '${job.name}'`, failedReason);
    });
  }
}

module.exports = QueueWorker;
