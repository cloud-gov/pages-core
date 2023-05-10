const { runFailStuckBuilds } = require('../../services/FailStuckBuilds');
const { createJobLogger } = require('./utils');

async function failStuckBuilds(job) {
  const logger = createJobLogger(job);

  logger.log('Failing stuck builds');

  const results = await runFailStuckBuilds();

  if (!results) {
    logger.log('No builds where stuck');
  } else {
    const buildIds = results.map(r => r.id);
    logger.log(`The following builds were failed: ${buildIds.join(', ')}`);
  }
}

module.exports = failStuckBuilds;
