const GitHub = require('./GitHub');
const { User, Site, Event } = require('../models');
const { logger } = require('../../winston');
const EventCreator = require('./EventCreator');

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

const verifyUserRepos = (user) => {
  let repos;
  return GitHub.getRepositories(user.githubAccessToken)
    .then((_repos) => {
      repos = _repos;
      return user.getSites();
    })
    .then((sites) => {
      const verified = [];
      const repoLastVerified = new Date();
      sites.forEach((site) => {
        const fullName = [site.owner, site.repository].join('/').toUpperCase();
        if (repos.find(repo => repo.full_name.toUpperCase() === fullName)) {
          verified.push(site.update({ repoLastVerified }));
        }
      });
      return Promise.all(verified);
    })
    .catch(err => EventCreator.error(Event.labels.SITE_USER, {
      error: err.stack,
      message: 'Unable to verify repositories for user',
      userId: user.id,
    }));
};

module.exports = { verifyRepos, verifyUserRepos };
