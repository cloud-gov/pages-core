const { User, Site } = require('../models');

const authorize = (user, build) => (
  User.findById(user.id, { include: [Site] })
    .then((userModel) => {
      const buildSiteId = build.site || build.Site.id;
      const matchingUserSite = userModel.Sites.find(site => buildSiteId === site.id);

      if (matchingUserSite) {
        return Promise.resolve();
      }
      return Promise.reject(403);
    }
  )
);

const findOne = (user, build) => authorize(user, build);

const create = (user, params) => {
  if (user.id !== params.user) {
    throw 403;
  }
  return authorize(user, params);
};

module.exports = { findOne, create };
