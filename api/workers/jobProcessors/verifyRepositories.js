const RepositoryVerifier = require('../../services/RepositoryVerifier');
const { logger } = require('../../../winston');

async function verifyRepositories() {
  const results = await RepositoryVerifier.verifyRepos();
  const successes = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);

  const failures = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);

  const msg = [`Repositories verified with ${successes.length} successes and ${failures.length} failures.`];
  if (successes.length) {
    msg.push(`   Successes:\n      ${successes.join('\n      ')}`);
  }
  if (failures.length) {
    msg.push(`   Failures:\n      ${failures.join('\n      ')}`);
  }

  if (failures.length) {
    logger.error(`Exiting with failed repository verifications.  ${msg.join('\n')}`);
    throw new Error(msg.join('\n'));
  }

  logger.info(msg.join('\n'));
}

module.exports = verifyRepositories;
