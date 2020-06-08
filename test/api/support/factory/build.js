const siteFactory = require('./site');
const userFactory = require('./user');
const { Build } = require('../../../../api/models');

// eslint-disable-next-line no-underscore-dangle
const _attributes = (overrides = {}) => {
  let { user, site } = overrides;

  if (!user) {
    user = userFactory();
  }
  if (!site) {
    site = Promise.resolve(user).then(u => siteFactory({ users: [u] }));
  }

  return Object.assign({
    site,
    user,
    token: Build.generateToken(),
  }, overrides);
};


function build(overrides, hooks = false) {
  return Promise.props(_attributes(overrides))
    .then((attributes) => {
      Object.keys(attributes).forEach((key) => {
        if (attributes[key].sequelize) {
        // eslint-disable-next-line no-param-reassign
          attributes[key] = attributes[key].id;
        }
      });

      return Build.create(attributes, { hooks });
    });
}

module.exports = build;
