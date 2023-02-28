const IORedis = require('ioredis');

const Github = require('./GitHub');
const S3SiteRemover = require('./S3SiteRemover');
const config = require('../../config');
const { SiteDeletionQueue } = require('../queues');

function queue() {
  const { redis: redisConfig } = config;
  return new SiteDeletionQueue(
    new IORedis(redisConfig.url, {
      tls: redisConfig.tls,
      maxRetriesPerRequest: null,
    })
  );
}
// this function should only be called within the queue/worker
module.exports.destroySiteInfra = async function destroySiteInfra(site, user) {
  const todos = [
    S3SiteRemover.removeSite(site)
      .then(() => S3SiteRemover.removeInfrastructure(site)),
  ];

  if (user) {
    todos.push(Github.deleteWebhook(site, user.githubAccessToken));
  }

  return Promise.allSettled(todos);
};

module.exports.destroySite = async function destroySite(site, user) {
  const domains = await site.getDomains();
  if (domains.length > 0) {
    // To simplify, not making a distinction on the state of the domain (provisioned or not),
    // the domain must be deprovisioned and deleted to delete the site.
    const message = `
      This site is associated with the following custom domains and cannot be deleted until they have been deleted:
      ${domains.map(domain => domain.names).join(', ')}
    `;
    return ['error', message];
  }

  // remove the database entry
  await site.destroy();

  this.queueDestroySiteInfra(site, user);

  return ['ok'];
};

module.exports.queueDestroySiteInfra = function queueDestroySiteInfra(site, user) {
  queue().add('destroySiteInfra', { site, user });
};
