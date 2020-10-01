/* eslint-disable no-console */
const timeoutBuilds = require('../api/services/TimeoutBuilds');

async function runTimeoutBuilds() {
  try {
    const results = await timeoutBuilds();
    const allBuildIds = results.map(r => r[0]);
    console.log(`${results.length} total builds timed out: [${allBuildIds.join(', ')}]`);

    const failedCancels = results.filter(([, result]) => result.status === 'rejected');
    if (failedCancels.length === 0) {
      process.exit(0);
    }

    const details = failedCancels.map(([buildId, { reason }]) => `${buildId}: ${reason}`).join('\n');
    throw new Error(`${failedCancels.length} build tasks could not be canceled:\n${details}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runTimeoutBuilds();
