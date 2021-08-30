const SandboxHelper = require('../../services/SandboxHelper');
const { logger } = require('../../../winston');

async function cleanSandboxOrganizations() {
  const results = await SandboxHelper.cleanSandboxes();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Sandbox organizations cleaned with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed cleaning of sandbox organizations.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = cleanSandboxOrganizations;
