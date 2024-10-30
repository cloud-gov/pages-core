const { Role } = require('../../../../api/models');

function build({ name } = {}) {
  const params = {
    name: name || 'role',
  };

  return Role.build(params);
}

function create(params) {
  return build(params).save();
}

function truncate() {
  return Role.truncate({
    force: true,
    cascade: true,
  });
}

module.exports = {
  build,
  create,
  truncate,
};
