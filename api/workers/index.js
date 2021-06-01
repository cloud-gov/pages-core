const { Queue } = require('bullmq');
const { logger } = require('../../winston');
const { QueueWorker } = require('./QueueWorker');

async function startScheduledWorker() {
  const nightly = '0 5 * * *';
  const everyTenMinutes = '0,10,20,30,40,50 * * * *';

  const scheduledWorker = new QueueWorker('scheduled');
  const scheduledQueue = new Queue(scheduledWorker.QUEUE_NAME, {
    connection: scheduledWorker.connection.duplicate(),
  });

  await scheduledQueue.drain(); // clear the queue

  await scheduledQueue.add('timeoutBuilds', {}, {
    repeat: { cron: everyTenMinutes },
    priority: 1,
  });

  await scheduledQueue.add('archiveBuildLogsDaily', {}, {
    repeat: { cron: nightly },
    priority: 10,
  });

  await scheduledQueue.add('nightlyBuilds', {}, {
    repeat: { cron: nightly },
    priority: 10,
  });

  await scheduledQueue.add('verifyRepos', {}, {
    repeat: { cron: nightly },
    priority: 10,
  });

  await scheduledQueue.add('revokeMembershipForInactiveUsers', {}, {
    repeat: { cron: nightly },
    priority: 10,
  });
}

Promise.all([
  startScheduledWorker(),
])
  .catch(logger.err);
