const NightlyBuildsHelper = require('../../services/NightlyBuildsHelper');
const { logger } = require('../../../winston');

async function nightlyBuilds() {
  const results = await NightlyBuildsHelper.nightlyBuilds();

  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Queued nightly builds with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed build errors.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = nightlyBuilds;
