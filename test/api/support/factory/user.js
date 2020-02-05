const { User } = require('../../../../api/models');

let userNameStep = 1;
function generateUniqueUserName() {
  const userName = `user${userNameStep}`;
  userNameStep += 1;
  return userName;
}

function userAttributes({ username, ...rest } = {}) {
  const uname = username || generateUniqueUserName();

  return {
    email: `${uname}@example.com`,
    username: uname,
    githubAccessToken: 'fake-access-token',
    githubUserId: 12345,
    signedInAt: new Date(),
    ...rest,
  };
}

function user(overrides) {
  const attributes = userAttributes(overrides);
  return User.create(attributes);
}

module.exports = user;
