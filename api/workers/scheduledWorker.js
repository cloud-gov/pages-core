const { Worker, QueueScheduler, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { logger } = require('../../winston');
const config = require('../../config');
const { handleWorker, monitorQueue } = require('./utils');
const jobProcessor = require('./jobProcessor');

async function processJob(job) {
  logger.info(`Processing Job: ${JSON.stringify(job)}`);
  switch (job.name) {
    case 'timeoutBuilds':
      return jobProcessor.runTimeoutBuilds();
    case 'archiveBuildLogsDaily':
      return jobProcessor.runArchiveBuildLogsDaily();
    case 'nightlyBuilds':
      return jobProcessor.runNightlyBuilds();
    case 'verifyRepos':
      return jobProcessor.runVerifyRepos();
    case 'revokeMembershipForInactiveUsers':
      return jobProcessor.runRevokeMembershipForInactiveUsers();
    default:
      throw new Error(`No processor found for job@name=${job.name}.`);
  }
}

class ScheduledWorker {
  constructor(queueName = 'scheduled', { concurrency = 5 } = {}) {
    const connection = new IORedis(config.redis.url);
    this.worker = new Worker(queueName, processJob, { connection, concurrency });
    this.queueEvents = new QueueEvents(queueName, { connection: connection.duplicate() });
    this.scheduler = new QueueScheduler(queueName, { connection: connection.duplicate() });
    this.QUEUE_NAME = queueName;
    this.connection = connection;

    handleWorker(this.worker);
    monitorQueue(this.queueEvents); // generic
  }
}

module.exports = {
  ScheduledWorker,
  processJob,
};
