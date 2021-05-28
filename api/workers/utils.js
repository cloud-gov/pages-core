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
  queueEvents.on('waiting', (job) => {
    log(job);
  });

  queueEvents.on('active', (job) => {
    log(job);
  });

  queueEvents.on('progress', (job) => {
    log(job);
  });

  queueEvents.on('drained', (job) => {
    log(job);
  });
}

function handleWorker(worker) {
  worker.on('error', (err) => {
    logger.error(`worker@name=${worker.QUEUE_NAME} error:`, err);
  });
}

module.exports = { monitorQueue, handleWorker };
