const {
  Worker, QueueScheduler, QueueEvents,
} = require('bullmq');
const IORedis = require('ioredis');
const { logger } = require('../../winston');
const config = require('../../config');
const { handleWorker, monitorQueue } = require('./utils');
const jobProcessors = require('./jobProcessors');

async function processJob(job) {
  logger.info(`Processing Job: ${JSON.stringify(job)}`);
  if (jobProcessors[job.name]) {
    return jobProcessors[job.name]();
  }
  throw new Error(`No processor found for job@name=${job.name}.`);
}

class QueueWorker {
  constructor(queueName, { concurrency = 5 } = {}) {
    this.QUEUE_NAME = queueName;
    const connection = new IORedis(config.redis.url);
    this.connection = connection;
    this.worker = new Worker(queueName, processJob, { connection, concurrency });
    this.queueEvents = new QueueEvents(queueName, { connection: connection.duplicate() });
    this.scheduler = new QueueScheduler(queueName, { connection: connection.duplicate() });

    handleWorker(this.worker);
    monitorQueue(this.queueEvents); // generic
  }
}

module.exports = {
  QueueWorker,
  processJob,
};
