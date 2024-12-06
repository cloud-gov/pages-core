const GitHub = require('./GitHub');
const { Site } = require('../models');
const { logger } = require('../../winston');

const verifyNextRepo = async (site, userIndex = 0) => {
  let found;
  const users = await site.getOrgUsers();
  return GitHub.getRepository(users[userIndex], site.owner, site.repository)
    .then((repo) => {
      found = repo;
      if (found) {
        // found can be null
        return site.update({
          repoLastVerified: new Date(),
        });
      }
      return Promise.resolve();
    })
    .catch(logger.warn)
    .then(() => {
      if (!found && users[userIndex + 1]) {
        return verifyNextRepo(site, userIndex + 1);
      }
      return Promise.resolve();
    });
};

const verifyRepos = async () => {
  return Site.findAll().then((sites) =>
    Promise.allSettled(sites.map((site) => verifyNextRepo(site))),
  );
};

module.exports = {
  verifyRepos,
};
