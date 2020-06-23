/* eslint-disable no-console */
const { nightlyBuilds } = require('../api/services/ScheduledBuildHelper');

async function runNightlyBuilds() {
  try {
    const result = await nightlyBuilds();

    const successes = result
      .filter(build => build.status === 'fulfilled')
      .map(build => build.value);

    const failures = result
      .filter(build => build.status === 'rejected')
      .map(build => build.reason);

    console.log(`\nQueued nightly builds with ${successes.length} successes and ${failures.length} failures.`);
    console.log('\nSuccesses:');
    console.log(`  ${successes.join('\n  ')}`);
    console.log('Failures:');
    console.error(`  ${failures.join('\n  ')}`);

    const exitCode = failures.length > 0 ? 1 : 0;

    if (exitCode === 1) {
      console.error('\nExiting with errors, see above for details.\n');
    }

    process.exit(exitCode);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runNightlyBuilds();
