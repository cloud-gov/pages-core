const { QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const { app: appConfig, redis: redisConfig } = require('../../config');
const { logger } = require('../../winston');
const { MailQueueName, ScheduledQueue, ScheduledQueueName } = require('../queues');
const { buildWorker } = require('./QueueWorker');
const { EVERY_TEN_MINUTES_CRON, NIGHTLY_CRON, shutdownGracefully } = require('./utils');

const everyTenMinutesJobConfig = {
  repeat: { cron: EVERY_TEN_MINUTES_CRON },
  priority: 1,
};

const nightlyJobConfig = {
  repeat: { cron: NIGHTLY_CRON },
  priority: 10,
};

// in calling code
// const { Queue } = require('bullmq');
// const queue = new Queue('mail');
// await queue.add('jobName', { to: '', subject: '', content: '' })''

const connection = new IORedis(redisConfig.url, {
  tls: redisConfig.tls,
});

// Workers
const workers = [
  buildWorker(ScheduledQueueName, processJob, connection),
  buildWorker(MailQueueName, () => {}, connection),
];

// Schedulers
const schedulers = [
  new QueueScheduler(ScheduledQueueName, { connection }),
];

// Jobs
async function queueScheduledJobs() {
  const scheduledQueue = new ScheduledQueue(connection);

  await scheduledQueue.drain(); // clear the queue

  const jobs = [
    scheduledQueue.add('timeoutBuilds', {}, everyTenMinutesJobConfig),
    scheduledQueue.add('nightlyBuilds', {}, nightlyJobConfig),
    scheduledQueue.add('verifyRepositories', {}, nightlyJobConfig),
    scheduledQueue.add('revokeMembershipForInactiveUsers', {}, nightlyJobConfig),
  ];

  if (appConfig.app_env === 'production') {
    jobs.push(scheduledQueue.add('archiveBuildLogsDaily', {}, nightlyJobConfig));
  }

  return Promise.all(jobs);
}

shutdownGracefully(() => Promise.all(
  [
    ...workers,
    ...schedulers,
  ].map(closable => closable.close())
));

queueScheduledJobs()
  .catch(logger.err);
