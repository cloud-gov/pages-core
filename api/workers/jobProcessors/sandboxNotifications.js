const SandboxReminder = require('../../services/SandboxReminder');
const { logger } = require('../../../winston');

async function sandboxNotifications() {
  const results = await SandboxReminder.notifyOrganizations();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Sandbox organization reminders queued with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed queued sandbox organization reminders.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = sandboxNotifications;
