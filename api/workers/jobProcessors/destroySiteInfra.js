const SiteDestroyer = require('../../services/SiteDestroyer');
const Mailer = require('../../services/mailer');
const Slacker = require('../../services/slacker');

const { logger } = require('../../../winston');

async function destroySiteInfra({ site, user }) {
  const results = await SiteDestroyer.destroySiteInfra(site, user);
  const errors = results
    .filter(result => result.status === 'rejected')
    .map(rejected => rejected.reason);

  if (errors.length > 0) {
    const reason = `Site deletion failed for id: ${site.id} - ${site.owner}/${site.repository}`;
    Mailer.init();
    Slacker.init();
    Mailer.sendAlert(reason, errors);
    Slacker.sendAlert(reason, errors);
    throw new Error(reason);
  }

  const msg = results.map(JSON.stringify);
  logger.info(msg.join('\n'));
  return true;
}

module.exports = destroySiteInfra;
