const FederalistUsersHelper = require('../../services/FederalistUsersHelper');
const { logger } = require('../../../winston');

async function revokeMembershipForUAAUsers() {
  const results = await FederalistUsersHelper.revokeMembershipForUAAUsers();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results.filter(r => r.status === 'rejected')
    .map(r => r.reason);

  const msg = [`UAA users removed from federalist-users with ${successes.length} successes and ${failures.length} failures.`];

  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = revokeMembershipForUAAUsers;
