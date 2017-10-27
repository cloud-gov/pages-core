const { User, Site } = require('../models');

const authorize = ({ id }, site) => (
  User.findById(id, { include: [Site] })
    .then((user) => {
      const hasSite = user.Sites.some(s => site.id === s.id);
      if (hasSite) {
        return Promise.resolve();
      }

      return Promise.reject(403);
    })
);

// create is allowed for all
const create = () => Promise.resolve();

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) => authorize(user, site);

module.exports = { create, findOne, update, destroy };
