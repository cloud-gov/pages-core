const { User, Site } = require('../models');

const authorize = ({ id }, site) => User.findById(id, { include: [Site] })
  .then((user) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const candidateSite of user.Sites) {
      if (site.id === candidateSite.id) {
        return Promise.resolve();
      }
    }
    return Promise.reject(403);
  }
);

const create = () => Promise.resolve();

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) => authorize(user, site);

module.exports = { create, findOne, update, destroy };
