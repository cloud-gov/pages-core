const Mailer = require('./mailer');
const Github = require('./GitHub');
const S3SiteRemover = require('./S3SiteRemover');

async function destroySite(site, user) {
  await site.destroy();

  // TODO move to background job
  // Don't wait for the infra, this should be all good from the user's point of view
  Promise.allSettled([
    user && Github.deleteWebhook(site, user.githubAccessToken),
    S3SiteRemover.removeSite(site)
      .then(() => S3SiteRemover.removeInfrastructure(site)),
  ])
    .then((results) => {
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(rejected => rejected.reason);

      if (errors.length > 0) {
        const reason = `Site deletion failed for id: ${site.id} - ${site.owner}/${site.repository}`;
        Mailer.sendAlert(reason, errors);
      }
    });
}

module.exports = {
  destroySite,
};
