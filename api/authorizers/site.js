const GitHub = require('../services/GitHub');
const siteErrors = require('../responses/siteErrors');
const { User, Site } = require('../models');

const authorize = ({ id }, site) => (
  User.findById(id, { include: [Site] })
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
);

// create is allowed for all
const create = () => Promise.resolve();
const addUser = () => Promise.resolve();

const createBuild = (user, site) => authorize(user, site);

const showActions = (user, site) => authorize(user, site);

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) => (
  authorize(user, site)
  .then(() => authorizeAdmin(user, site))
);

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
