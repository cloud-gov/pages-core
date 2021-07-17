const { logger } = require('../../../winston');

function multiJobProcessor(processors) {
  return async function processJob(job) {
    logger.info(`Processing Job: ${JSON.stringify(job)}`);
    if (processors[job.name]) {
      return processors[job.name](job);
    }
    throw new Error(`No processor found for job type: ${job.name}.`);
  };
}

module.exports = multiJobProcessor;
