const SiteDestroyer = require('../../services/SiteDestroyer');
const QueueJobs = require('../../queue-jobs');
const { createQueueConnection } = require('../../utils/queues');

const connection = createQueueConnection();
const queueJob = new QueueJobs(connection);

const { logger } = require('../../../winston');

async function destroySiteInfra({ site, user }) {
  const results = await SiteDestroyer.destroySiteInfra(site, user);
  const errors = results
    .filter(result => result.status === 'rejected')
    .map(rejected => rejected.reason);

  if (errors.length > 0) {
    const reason = `Site deletion failed for id: ${site.id} - ${site.owner}/${site.repository}`;
    queueJob.sendAlert(reason, errors);
    throw new Error(reason);
  }

  const msg = results.map(JSON.stringify);
  logger.info(msg.join('\n'));
  return true;
}

module.exports = destroySiteInfra;
