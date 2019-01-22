const logger = require('winston');
const { User, Site, SiteUser } = require('../models');
const GitHub = require('./GitHub');

const auditUser = (user) =>
  GitHub.getRepositories(user.githubAccessToken)
    .then((repos) => {
      const removed = [];
      user.Sites.forEach(site => {
        const fullName = [site.owner, site.repository].join('/');
        if (repos.find(repo => repo.full_name === fullName && !repo.permissions.push)) {
          removed.push(SiteUser.destroy({ where: { user_sites: user.id, site_users: site.id }}));
        }
      });
      return Promise.all(removed);
    });

const auditAllUsers = () =>
  User.findAll({
    attributes: ['username', 'githubAccessToken', 'signedInAt'],
    where: {
      githubAccessToken: { $ne: null },
      signedInAt: { $ne: null },
    },
    order: [['signedInAt', 'DESC']],
    include: [{ model: Site, attributes: ['owner', 'repository'] }],
  })
  .then((users) => {
    const auditedUsers = [];
    users.forEach(user => auditedUsers.push(auditSiteUsers(user)));
    return Promise.all(auditUser);
  });

const auditSite = (site, userIndex = 0) => {
  let collaborators;
  const user = site.Users[userIndex];
  if (!user) { return Promise.resolve(); }

  return GitHub.getCollaborators(user.githubAccessToken, site.owner, site.repository)
    .then((collabs) => {
      collaborators = collabs;
    })
    .catch(logger.warn(e))
    .then(() => {
      if (collaborators && collaborators.length > 0) {
        const removed = [];
        const push_collabs = collaborators.filter(c => c.permissions.push).map(c => c.login);
        const usersToRemove = site.Users.filter(u => !push_collabs.includes(u.username));
        // usersToRemove.forEach(u => 
        //   removed.push(SiteUser.destroy({ where: { user_sites: u.id, site_users: site.id }})));
        // return Promise.all(removed);
        return SiteUser.destroy({ 
          where: { user_sites: usersToRemove.map(u => u.id), site_users: site.id }
        });
      }
      return auditSite(site, userIndex + 1);
    });
}

const auditAllSites = () =>
  Site.findAll({
    attributes: ['owner','repository']
    include: [{ model: User.scope('withGithub'), attributes: ['username', 'githubAccessToken', 'signedInAt']],
    order: [
      [User, 'signedInAt', 'DESC'],
    ],
  })
    .then((sites) => {
      const auditedSites = [];
      sites.forEach(site => auditedSites.push(auditSite(site)));
      return Promise.all(auditedSites);
    })

module.exports = { auditAllUsers };
