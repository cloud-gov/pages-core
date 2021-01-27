const GitHub = require('./GitHub');
const { User, Site } = require('../models');
const { logger } = require('../../winston');

const verifyNextRepo = (site, userIndex = 0) => {
  let found;
  return GitHub.getRepository(site.Users[userIndex], site.owner, site.repository)
    .then((repo) => {
      found = repo;
      if (found) { // found can be null
        return site.update({ repoLastVerified: new Date() });
      }
      return Promise.resolve();
    })
    .catch(logger.warn)
    .then(() => {
      if (!found && site.Users[userIndex + 1]) {
        return verifyNextRepo(site, userIndex + 1);
      }
      return Promise.resolve();
    });
};

const verifyRepos = () => Site.findAll({
  include: [User.scope('withGithub')],
  order: [
    [User, 'signedInAt', 'DESC'],
  ],
})
  .then(sites => Promise.all(sites.map(site => verifyNextRepo(site))));

const verifyUserRepos = async (user) => {
  const repoLastVerified = new Date();

  const [repos, sites] = await Promise.all([
    GitHub.getRepositories(user.githubAccessToken),
    user.getSites(),
  ]);

  const verified = sites
    .filter((site) => {
      const fullName = [site.owner, site.repository].join('/').toUpperCase();
      return repos.find(repo => repo.full_name.toUpperCase() === fullName);
    })
    .map(site => site.update({ repoLastVerified }));

  return Promise.all(verified);
};

module.exports = { verifyRepos, verifyUserRepos };
