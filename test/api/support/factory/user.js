const { User } = require('../../../../api/models');

let userNameStep = 1;
function generateUniqueUserName() {
  // eslint-disable-next-line no-plusplus
  return `user${userNameStep++}`;
}

function userAttributes(overrides) {
  const username = generateUniqueUserName();

  return Object.assign({
    email: `${username}@example.com`,
    username,
    githubAccessToken: 'fake-access-token',
    githubUserId: 12345,
    signedInAt: new Date(),
  }, overrides);
}

function user(overrides) {
  const attributes = userAttributes(overrides);
  return User.create(attributes);
}

module.exports = user;
