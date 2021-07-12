const { logger } = require('../../winston');

function monitorQueue(queueEvents) {
  function log(job, err = null) {
    if (err) {
      logger.error(`queue@name=${queueEvents.name} job=${JSON.stringify(job)}`, err);
      return;
    }
    logger.info(`queue@name=${queueEvents.name} job=${JSON.stringify(job)}`);
  }

  queueEvents.on('completed', (job) => {
    log(job);
  });

  queueEvents.on('failed', (job, failedReason) => {
    log(job, failedReason);
  });
}

function handleWorker(worker) {
  worker.on('error', (err) => {
    logger.error(`worker@name=${worker.QUEUE_NAME} error:`, err);
  });
}

const EVERY_TEN_MINUTES_CRON = '0,10,20,30,40,50 * * * *';
const NIGHTLY_CRON = '0 5 * * *';

async function shutdownGracefully(cleanup) {
  const listener = async () => {
    await Promise.resolve(cleanup());
    process.exit(0);
  };
  process.on('SIGINT', listener);
  process.on('SIGTERM', listener);
  process.on('SIGHUP', listener);
}

module.exports = {
  EVERY_TEN_MINUTES_CRON,
  NIGHTLY_CRON,
  monitorQueue,
  handleWorker,
  shutdownGracefully,
};
