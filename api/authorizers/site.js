const GitHub = require('../services/GitHub');
const siteErrors = require('../responses/siteErrors');
const { User, Site } = require('../models');
const FederalistUsersHelper = require('../services/FederalistUsersHelper');

const authorize = ({ id }, site) => (
  User.findByPk(id, { include: [Site] })
    .then((user) => {
      const hasSite = user.Sites.some(s => site.id === s.id);
      if (hasSite) {
        return Promise.resolve(site.id);
      }

      return Promise.reject(403);
    })
);

const authorizeAdmin = (user, site) => (
  GitHub.checkPermissions(user, site.owner, site.repository)
    .then((permissions) => {
      if (!permissions.admin) {
        return Promise.reject({
          message: siteErrors.ADMIN_ACCESS_REQUIRED,
          status: 403,
        });
      }
      return Promise.resolve(site.id);
    })
    .catch((error) => {
      if (error.status === 404) {
      // authorize user if the site's repo does not exist:
      // When a user attempts to delete a site after deleting the repo, Federalist
      // attempts to fetch the repo but it no longer exists and receives a 404
        return Promise.resolve(site.id);
      }
      return Promise.reject({
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 403,
      });
    })
);

const authorizeFederalistUsersAdmin = (user) =>
  FederalistUsersHelper.federalistUsersAdmins(user.username)
    .then((admins) => {
      if (!admins.includes(user.username)) {
        return Promise.reject({
          message: siteErrors.ADMIN_ACCESS_REQUIRED,
          status: 403,
        });
      }
    })
    .catch((error) => {
      return Promise.reject({
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 403,
      });
    });

// create is allowed for all
const create = () => Promise.resolve();
const addUser = () => Promise.resolve();

const createBuild = (user, site) => authorize(user, site);

const showActions = (user, site) => authorize(user, site);

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) => {
  return authorize(user, site)
    .then(() => authorizeAdmin(user, site))
    .catch(() => {
      return authorizeFederalistUsersAdmin(user);
    });
}

const removeUser = (user, site) => authorize(user, site);

module.exports = {
  create,
  findOne,
  update,
  destroy,
  addUser,
  removeUser,
  showActions,
  createBuild,
};
