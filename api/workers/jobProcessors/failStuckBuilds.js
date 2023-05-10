const { runFailStuckBuilds } = require('../../services/FailStuckBuilds');
const { createJobLogger } = require('./utils');

async function failStuckBuilds(job) {
  const logger = createJobLogger(job);

  logger.log('Failing stuck builds');

  const results = await runFailStuckBuilds();

  if (!results) {
    const message = 'No builds where stuck';
    logger.log(message);

    return message;
  }

  const buildIds = results.map(r => r.id);
  const message = `The following builds were failed: ${buildIds.join(', ')}`;
  logger.log(message);
  return message;
}

module.exports = failStuckBuilds;
