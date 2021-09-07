const Mailer = require('./mailer');
const Slacker = require('./slacker');
const Github = require('./GitHub');
const S3SiteRemover = require('./S3SiteRemover');

// TODO move to background job
module.exports.destroySiteInfra = async function destroySiteInfra(site, user) {
  const todos = [
    S3SiteRemover.removeSite(site)
      .then(() => S3SiteRemover.removeInfrastructure(site)),
  ];

  if (user) {
    todos.push(Github.deleteWebhook(site, user.githubAccessToken));
  }

  const results = await Promise.allSettled(todos);

  const errors = results
    .filter(result => result.status === 'rejected')
    .map(rejected => rejected.reason);

  if (errors.length > 0) {
    const reason = `Site deletion failed for id: ${site.id} - ${site.owner}/${site.repository}`;
    Mailer.sendAlert(reason, errors);
    Slacker.sendAlert(reason, errors);
    throw new Error(reason);
  }

  return results;
};

module.exports.destroySite = async function destroySite(site, user) {
  await site.destroy();

  // Don't wait for the infra, this should be all good from the user's point of view
  module.exports.destroySiteInfra(site, user)
    .catch(() => {});
};
