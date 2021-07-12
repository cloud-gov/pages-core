const { Worker } = require('bullmq');
const { logger } = require('../../winston');
const jobProcessors = require('./jobProcessors');

async function processJob(job) {
  logger.info(`Processing Job: ${JSON.stringify(job)}`);
  if (jobProcessors[job.name]) {
    return jobProcessors[job.name]();
  }
  throw new Error(`No processor found for job@name=${job.name}.`);
}

const defaultOpts = {
  concurrency: 5,
  scheduled: false,
};

function jobMessage(job) {
  return `queue@name=${job.queueName} job=${JSON.stringify(job)}`;
}

function buildWorker(queueName, processor, connection, opts = {}) {
  const { concurrency } = { ...defaultOpts, ...opts };

  const worker = new Worker(queueName, processor, { connection, concurrency });

  worker.on('error', (err) => {
    logger.error(`worker@name=${queueName} error:`, err);
  });

  worker.on('completed', (job) => {
    logger.info(jobMessage(job));
  });

  worker.on('failed', (job, failedReason) => {
    logger.error(jobMessage(job), failedReason);
  });

  return worker;
}

module.exports = {
  buildWorker,
  processJob,
};
