const TimeoutBuilds = require('../../services/TimeoutBuilds');
const { logger } = require('../../../winston');

async function timeoutBuilds() {
  const results = await TimeoutBuilds.timeoutBuilds();
  const allBuildIds = results.map(r => r[0]);
  logger.info(`${results.length} total builds timed out: [${allBuildIds.join(', ')}]`);

  const failedCancels = results.filter(([, result]) => result.status === 'rejected');

  if (failedCancels.length === 0) {
    return;
  }

  const details = failedCancels.map(([buildId, { reason }]) => `${buildId}: ${reason}`).join('\n');
  throw new Error(`${failedCancels.length} build tasks could not be canceled:\n${details}`);
}

module.exports = timeoutBuilds;
