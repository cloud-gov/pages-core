const path = require('path');
const IORedis = require('ioredis');

const { redis: redisConfig, queues: queuesConfig } = require('../../config');

const { logger } = require('../../winston');

const DomainService = require('../services/Domain');
const {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  BuildTasksQueue,
  BuildTasksQueueName,
  CreateEditorSiteQueue,
  CreateEditorSiteQueueName,
  DomainQueueName,
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
  MailQueueName,
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SiteBuildsQueue,
  SiteBuildsQueueName,
  SiteDeletionQueueName,
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
} = require('../queues');

const Processors = require('./jobProcessors');
const Mailer = require('./Mailer');
const QueueWorker = require('./QueueWorker');

const EVERY_TEN_MINUTES_CRON = '0,10,20,30,40,50 * * * *';

const everyTenMinutesJobConfig = {
  repeat: {
    cron: EVERY_TEN_MINUTES_CRON,
  },
  priority: 1,
};

const makeNightlyJobConfig = (minute = 0, hour = 5) => ({
  repeat: {
    cron: `${minute} ${hour} * * *`,
  },
  priority: 10,
});

function pagesWorker(connection) {
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

  const buildTasksProcessor = (job) => Processors.buildTaskRunner(job);
  const createEditorSiteProcessor = (job) => Processors.createEditorSite(job);
  const siteBuildProcessor = (job) => Processors.siteBuildRunner(job);
  const failBuildsProcessor = (job) => Processors.failStuckBuilds(job);
  const siteDeletionProcessor = (job) => Processors.destroySiteInfra(job.data);
  const mailJobProcessor = (job) => new Mailer().send(job.data);

  const nightlyBuildsProcessor = () => Processors.nightlyBuilds();

  const scheduledJobProcessor = Processors.multiJobProcessor({
    sandboxNotifications: Processors.sandboxNotifications,
    cleanSandboxOrganizations: Processors.cleanSandboxOrganizations,
    buildTasksScheduler: Processors.buildTasksScheduler,
  });

  const timeoutBuildsProcessor = () => Processors.timeoutBuilds();

  const workers = [
    new QueueWorker(
      ArchiveBuildLogsQueueName,
      connection,
      path.join(__dirname, 'jobProcessors', 'archiveBuildLogsDaily.js'),
    ),
    new QueueWorker(BuildTasksQueueName, connection, buildTasksProcessor, {
      concurrency: queuesConfig.buildTasksConcurrency,
    }),
    new QueueWorker(CreateEditorSiteQueueName, connection, createEditorSiteProcessor),
    new QueueWorker(DomainQueueName, connection, domainJobProcessor),
    new QueueWorker(FailStuckBuildsQueueName, connection, failBuildsProcessor),
    new QueueWorker(MailQueueName, connection, mailJobProcessor),
    new QueueWorker(NightlyBuildsQueueName, connection, nightlyBuildsProcessor),
    new QueueWorker(ScheduledQueueName, connection, scheduledJobProcessor),
    new QueueWorker(SiteBuildsQueueName, connection, siteBuildProcessor, {
      concurrency: queuesConfig.siteBuildsConcurrency,
    }),
    new QueueWorker(SiteDeletionQueueName, connection, siteDeletionProcessor),
    new QueueWorker(TimeoutBuildTasksQueueName, connection, timeoutBuildsProcessor),
  ];

  const archiveBuildLogsQueue = new ArchiveBuildLogsQueue(connection);
  const buildTasksQueue = new BuildTasksQueue(connection);
  const createEditorSiteQueue = new CreateEditorSiteQueue(connection);
  const failStuckBuildsQueue = new FailStuckBuildsQueue(connection);
  const nightlyBuildsQueue = new NightlyBuildsQueue(connection);
  const scheduledQueue = new ScheduledQueue(connection);
  const siteBuildsQueue = new SiteBuildsQueue(connection);
  const timeoutBuildTasksQueue = new TimeoutBuildTasksQueue(connection);
  const queues = [
    archiveBuildLogsQueue,
    buildTasksQueue,
    createEditorSiteQueue,
    failStuckBuildsQueue,
    nightlyBuildsQueue,
    scheduledQueue,
    siteBuildsQueue,
    timeoutBuildTasksQueue,
  ];

  const jobs = () =>
    Promise.all([
      archiveBuildLogsQueue.add('archiveBuildLogsDaily', {}, makeNightlyJobConfig(30, 4)),
      failStuckBuildsQueue.add('failStuckBuilds', {}, everyTenMinutesJobConfig),
      nightlyBuildsQueue.add('nightlyBuilds', {}, makeNightlyJobConfig(0, 5)),
      scheduledQueue.add('sandboxNotifications', {}, makeNightlyJobConfig(30, 5)),
      scheduledQueue.add('cleanSandboxOrganizations', {}, makeNightlyJobConfig(30, 5)),
      scheduledQueue.add('buildTasksScheduler', {}, makeNightlyJobConfig(0, 6)),
      timeoutBuildTasksQueue.add('timeoutBuilds', {}, everyTenMinutesJobConfig),
    ]);

  return {
    jobs,
    queues,
    workers,
  };
}

async function start() {
  const connection = new IORedis(redisConfig.url, {
    tls: redisConfig.tls,
    maxRetriesPerRequest: null,
  });

  const { jobs, queues, workers } = pagesWorker(connection);

  const cleanup = async () => {
    logger.info(
      'Worker process received request to shutdown, cleaning up and shutting down.',
    );
    const closables = [...workers, ...queues];

    await Promise.all(closables.map((closable) => closable.close()));

    logger.info('Worker process all cleaned up, shutting down.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGHUP', cleanup);

  // clear the queues
  await Promise.all(queues.map((queue) => queue.drain()));

  // queue the jobs
  await jobs();
}

start().catch(logger.err);
