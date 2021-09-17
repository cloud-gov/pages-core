const { QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

const { app: appConfig, mailer: mailerConfig, redis: redisConfig } = require('../../config');
const { logger } = require('../../winston');

const {
  MailQueueName, ScheduledQueue, ScheduledQueueName, SlackQueueName,
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

async function start() {
  const connection = new IORedis(redisConfig.url, {
    tls: redisConfig.tls,
  });

  const slack = new Slack();

  // Processors
  let mailJobProcessor;

  // Hack to use Slack for the mailer queue for Federalist
  if (mailerConfig.username) {
    const mailer = new Mailer();
    mailJobProcessor = job => mailer.send(job.data);
  } else {
    mailJobProcessor = (job) => {
      // ignore alerts since they are already sent to both
      if (job.name === 'alert') {
        return 'ignored';
      }
      return slack.send({
        channel: 'federalist-supportstream',
        text: job.data.html,
        username: 'Federalist Mailer',
      });
    };
  }

  const scheduledJobProcessor = Processors.multiJobProcessor({
    archiveBuildLogsDaily: Processors.archiveBuildLogsDaily,
    nightlyBuilds: Processors.nightlyBuilds,
    revokeMembershipForInactiveUsers: Processors.revokeMembershipForInactiveUsers,
    revokeMembershipForUAAUsers: Processors.revokeMembershipForUAAUsers,
    timeoutBuilds: Processors.timeoutBuilds,
    verifyRepositories: Processors.verifyRepositories,
    sandboxNotifications: Processors.sandboxNotifications,
    cleanSandboxOrganizations: Processors.cleanSandboxOrganizations,
  });

  const slackJobProcessor = job => slack.send(job.data);

  // Workers
  const workers = [
    new QueueWorker(MailQueueName, connection, mailJobProcessor),
    new QueueWorker(ScheduledQueueName, connection, scheduledJobProcessor),
    new QueueWorker(SlackQueueName, connection, slackJobProcessor),
  ];

  // Schedulers
  const schedulers = [
    new QueueScheduler(MailQueueName, { connection }),
    new QueueScheduler(ScheduledQueueName, { connection }),
    new QueueScheduler(SlackQueueName, { connection }),
  ];

  // Queues
  const scheduledQueue = new ScheduledQueue(connection);

  const cleanup = async () => {
    logger.info('Worker process received request to shutdown, cleaning up and shutting down.');
    const closables = [
      ...workers,
      ...schedulers,
      scheduledQueue,
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

  // Jobs
  const jobs = [
    scheduledQueue.add('timeoutBuilds', {}, everyTenMinutesJobConfig),
    scheduledQueue.add('nightlyBuilds', {}, nightlyJobConfig),
    scheduledQueue.add('verifyRepositories', {}, nightlyJobConfig),
    scheduledQueue.add('revokeMembershipForInactiveUsers', {}, nightlyJobConfig),
    scheduledQueue.add('revokeMembershipForUAAUsers', {}, nightlyJobConfig),
  ];

  if (appConfig.app_env === 'production') {
    jobs.push(scheduledQueue.add('archiveBuildLogsDaily', {}, nightlyJobConfig));
    jobs.push(scheduledQueue.add('sandboxNotifications', {}, nightlyJobConfig));
    jobs.push(scheduledQueue.add('cleanSandboxOrganizations', {}, nightlyJobConfig));
  }

  await scheduledQueue.drain(); // clear the queue
  await Promise.all(jobs);
}

start()
  .catch(logger.err);
