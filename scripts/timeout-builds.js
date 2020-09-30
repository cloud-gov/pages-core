/* eslint-disable no-console */
const timeoutBuilds = require('../api/services/TimeoutBuilds');

async function runTimeoutBuilds() {
  try {
    const [count, timedoutBuilds] = await timeoutBuilds();
    console.log(`Timed out ${count} total builds: [${timedoutBuilds.map(b => b.id).join(', ')}]`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runTimeoutBuilds();
