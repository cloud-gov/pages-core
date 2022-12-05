const { QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');

const {
  app: {
    appEnv,
    product,
  },
  redis: redisConfig,
} = require('../../config');

const { logger } = require('../../winston');

const DomainService = require('../services/Domain');
const {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  DomainQueueName,
  MailQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueueName,
} = require('../queues');

const Processors = require('./jobProcessors');
const Mailer = require('./Mailer');
const QueueWorker = require('./QueueWorker');
const Slack = require('./Slack');

const EVERY_TEN_MINUTES_CRON = '0,10,20,30,40,50 * * * *';
const NIGHTLY_CRON = '0 5 * * *';

const everyTenMinutesJobConfig = {
  repeat: { cron: EVERY_TEN_MINUTES_CRON },
  priority: 1,
};

const nightlyJobConfig = {
  repeat: { cron: NIGHTLY_CRON },
  priority: 10,
};

function federalistWorker(connection) {
  const domainJobProcessor = (job) => {
    switch (job.name) {
      case 'checkProvisionStatus':
        return DomainService.checkProvisionStatus(job.data.id);
      case 'checkDeprovisionStatus':
        return DomainService.checkDeprovisionStatus(job.data.id);
      default:
        throw new Error(`Unknown job name ${job.name} for Domain Queue`);
    }
  };

  const scheduledJobProcessor = Processors.multiJobProcessor({
    nightlyBuilds: Processors.nightlyBuilds,
    revokeMembershipForInactiveUsers: Processors.revokeMembershipForInactiveUsers,
    timeoutBuilds: Processors.timeoutBuilds,
    verifyRepositories: Processors.verifyRepositories,
  });

  const slackJobProcessor = job => (new Slack()).send(job.data);

  const workers = [
    new QueueWorker(ArchiveBuildLogsQueueName, connection,
      path.join(__dirname, 'jobProcessors', 'archiveBuildLogsDaily.js')),
    new QueueWorker(DomainQueueName, connection, domainJobProcessor),
    new QueueWorker(ScheduledQueueName, connection, scheduledJobProcessor),
    new QueueWorker(SlackQueueName, connection, slackJobProcessor),
  ];

  const schedulers = [
    new QueueScheduler(ArchiveBuildLogsQueueName, { connection }),
    new QueueScheduler(DomainQueueName, { connection }),
    new QueueScheduler(ScheduledQueueName, { connection }),
    new QueueScheduler(SlackQueueName, { connection }),
  ];

  const archiveBuildLogsQueue = new ArchiveBuildLogsQueue(connection);
  const scheduledQueue = new ScheduledQueue(connection);
  const queues = [
    archiveBuildLogsQueue,
    scheduledQueue,
  ];

  const jobs = () => Promise.all([
    scheduledQueue.add('timeoutBuilds', {}, everyTenMinutesJobConfig),
    scheduledQueue.add('nightlyBuilds', {}, nightlyJobConfig),
    scheduledQueue.add('verifyRepositories', {}, nightlyJobConfig),
    scheduledQueue.add('revokeMembershipForInactiveUsers', {}, nightlyJobConfig),
    appEnv === 'production'
      ? archiveBuildLogsQueue.add('archiveBuildLogsDaily', {}, nightlyJobConfig)
      : Promise.resolve(),
  ]);

  return {
    jobs, queues, schedulers, workers,
  };
}

function pagesWorker(connection) {
  const mailJobProcessor = appEnv === 'development'
    ? job => logger.info(job.data)
    : job => (new Mailer()).send(job.data);

  const scheduledJobProcessor = Processors.multiJobProcessor({
    revokeMembershipForUAAUsers: Processors.revokeMembershipForUAAUsers,
    sandboxNotifications: Processors.sandboxNotifications,
    cleanSandboxOrganizations: Processors.cleanSandboxOrganizations,
  });

  const workers = [
    new QueueWorker(MailQueueName, connection, mailJobProcessor),
    new QueueWorker(ScheduledQueueName, connection, scheduledJobProcessor),
  ];

  const schedulers = [
    new QueueScheduler(MailQueueName, { connection }),
    new QueueScheduler(ScheduledQueueName, { connection }),
  ];

  const scheduledQueue = new ScheduledQueue(connection);
  const queues = [scheduledQueue];

  const jobs = () => Promise.all([
    scheduledQueue.add('revokeMembershipForUAAUsers', {}, nightlyJobConfig),
    scheduledQueue.add('sandboxNotifications', {}, nightlyJobConfig),
    scheduledQueue.add('cleanSandboxOrganizations', {}, nightlyJobConfig),
  ]);

  return {
    jobs, queues, schedulers, workers,
  };
}

async function start() {
  const connection = new IORedis(redisConfig.url, {
    tls: redisConfig.tls,
    maxRetriesPerRequest: null,
  });

  const {
    jobs, queues, schedulers, workers,
  } = (
    product === 'pages'
      ? pagesWorker(connection)
      : federalistWorker(connection)
  );

  const cleanup = async () => {
    logger.info('Worker process received request to shutdown, cleaning up and shutting down.');
    const closables = [
      ...workers,
      ...schedulers,
      ...queues,
    ];

    await Promise.all(
      closables.map(closable => closable.close())
    );

    logger.info('Worker process all cleaned up, shutting down.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGHUP', cleanup);

  // clear the queues
  await Promise.all(queues.map(queue => queue.drain()));

  // queue the jobs
  await jobs();
}

start()
  .catch(logger.err);
