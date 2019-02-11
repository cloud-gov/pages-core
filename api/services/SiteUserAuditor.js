const logger = require('winston');
const { User, Site } = require('../models');
const GitHub = require('./GitHub');
const UserActionCreator = require('./UserActionCreator');

const auditUser = (user, auditor) => {
  let repos;
  return GitHub.getRepositories(user.githubAccessToken)
    .then((_repos) => {
      repos = _repos;
      return user.getSites();
    })
    .then((sites) => {
      const removed = [];
      sites.forEach((site) => {
        const fullName = [site.owner, site.repository].join('/').toUpperCase();
        if (!(repos.find(repo => repo.full_name.toUpperCase() === fullName)) || // site not in repos
          (repos.find(repo => repo.full_name.toUpperCase() === fullName &&
          !repo.permissions.push))) { // site does not have push permissions
          const r = site.removeUser(user)
            .then(() => UserActionCreator.addRemoveAction({
              userId: auditor.id,
              targetId: user.id,
              targetType: 'user',
              siteId: site.id,
            }))
            .catch(logger.error);
          removed.push(r);
        }
      });
      return Promise.all(removed);
    })
    .catch(logger.error);
};

const auditAllUsers = () => {
  let auditor;
  return User.findOne({ where: { username: process.env.USER_AUDITOR } })
    .then((model) => {
      auditor = model
      return User.findAll({
        attributes: ['id', 'username', 'githubAccessToken', 'signedInAt'],
        where: {
          githubAccessToken: { $ne: null },
          signedInAt: { $ne: null },
        },
        order: [['signedInAt', 'DESC']]
      });
    })
    .then((users) => Promise.all(users.map(user => auditUser(user, auditor))));
  }

const auditSite = (auditor, site, userIndex = 0) => {
  let collaborators;
  const user = site.Users[userIndex];
  if (!user) { return Promise.resolve(); }

  return GitHub.getCollaborators(user.githubAccessToken, site.owner, site.repository)
    .then((collabs) => {
      collaborators = collabs;
    })
    .catch(logger.warn)
    .then(() => {
      if (collaborators && collaborators.length > 0) {
        const pushCollabs = collaborators.filter(c => c.permissions.push).map(c => c.login);
        const usersToRemove = site.Users.filter(u => !pushCollabs.includes(u.username));
        const removed = [];
        usersToRemove.forEach((u) => {
          const r = site.removeUser(u)
            .then(() => UserActionCreator.addRemoveAction({
              userId: auditor.id,
              targetId: user.id,
              targetType: 'user',
              siteId: site.id,
            }))
            .catch(logger.error);
          removed.push(r);
        });
        return Promise.all(removed);
      }
      return auditSite(auditor, site, userIndex + 1);
    })
    .catch(logger.error);
};

const auditAllSites = () => {
  let auditor;
  return User.findOne({ where: { username: process.env.USER_AUDITOR } })
    .then((model) => {
      auditor = model;
      return Site.findAll({
        attributes: ['id', 'owner', 'repository'],
        include: [{
          model: User.scope('withGithub'),
          attributes: ['id', 'username', 'githubAccessToken', 'signedInAt'],
        }],
        order: [[User, 'signedInAt', 'DESC']],
      });
    })
    .then((sites) => {
      const auditedSites = [];
      sites.forEach(site => auditedSites.push(auditSite(auditor, site)));
      return Promise.all(auditedSites);
    });
}
module.exports = { auditAllUsers, auditAllSites, auditUser };
