const { User } = require('../../../../api/models');
const uaaIdentity = require('./uaa-identity');
const user = require('./user');

const counters = {};

function increment(key = 'email') {
  counters[key] = (counters[key] || 0) + 1;
  return `user.${counters[key]}@example.gov`;
}

async function build(params = {}) {
  let { email } = params;

  if (!email) {
    email = increment();
  }

  const createdUser = await user({ email });
  const createdUAAId = await uaaIdentity.createUAAIdentity({
    userId: createdUser.id,
    email,
  });

  return {
    user: createdUser,
    uaaIdentity: createdUAAId,
  };
}

function create(params) {
  return build(params);
}

function truncate() {
  return User.truncate({
    force: true,
    cascade: true,
  });
}

module.exports = {
  build,
  create,
  truncate,
};
