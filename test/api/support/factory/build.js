const siteFactory = require('./site');
const userFactory = require('./user');
const { Build } = require('../../../../api/models');

// eslint-disable-next-line no-underscore-dangle
const _attributes = (overrides = {}) => {
  let { user, site, username, branch } = overrides;

  if (!user) {
    user = userFactory();
  }
  if (!site) {
    site = Promise.resolve(user).then(u => siteFactory({ users: [u] }));
  }

  if (!username) {
    username = Promise.resolve(user).then(u => u.username);
  }

  if (!branch) {
    branch = 'test-branch';
  }

  return {
    site,
    user,
    username,
    branch,
    token: Build.generateToken(),
    ...overrides,
  };
};

function build(overrides) {
  return Promise.props(_attributes(overrides))
    .then((attributes) => {
      Object.keys(attributes).forEach((key) => {
        if (attributes[key].sequelize) {
        // eslint-disable-next-line no-param-reassign
          attributes[key] = attributes[key].id;
        }
      });

      return Build.create(attributes);
    });
}

module.exports = build;
