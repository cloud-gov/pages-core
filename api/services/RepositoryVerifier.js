const GitHub = require('./GitHub');
const { User, Site } = require('../models');
const logger = require('winston');

const verifyRepos = () =>
  Site.findAll({ 
    include: [User.scope('withGithub')],
    order: [
      [ User, 'signedInAt', 'DESC' ],
    ],
  })
  .then(sites => Promise.all(sites.map(site => verifyNextRepo(site))));

const verifyNextRepo = (site, userIndex = 0) => {
  let found;
  return GitHub.getRepository(site.Users[userIndex], site.owner, site.repository)
    .then(repo => {
      found = repo;
      if (found) { // found can be null
        return site.update({ repoLastVerified: new Date() });
      }
    })
    .catch(logger.warn)
    .then(() => {
      if (!found && site.Users[userIndex + 1]) {
        return verifyNextRepo(site, userIndex + 1);
      }
    });
}

module.exports = { verifyRepos };
