const crypto = require('crypto');
const { UAAIdentity } = require('../../../../api/models');

function generateRandomId() {
  const bytes = crypto.randomBytes(10);
  return crypto.createHash('md5').update(bytes).digest('hex');
}

let userNameStep = 1;
function generateUniqueUserNameEmail() {
  const userName = `user${userNameStep}@example.gov`;
  userNameStep += 1;
  return userName;
}

function profileAttributes({ userId, username, ...rest } = {}) {
  const uname = username || generateUniqueUserNameEmail();
  const id = userId || generateRandomId();

  return {
    user_id: id,
    user_name: uname,
    email_verified: false,
    email: uname,
    username: uname,
    ...rest,
  };
}

function userAttributes({
  uaaId, userId, username, groups, ...rest
} = {}) {
  const uname = username || generateUniqueUserNameEmail();
  const email = generateUniqueUserNameEmail();
  const usersGroups = groups || [];
  const userUaaId = uaaId || generateRandomId();
  const userUserId = userId || generateRandomId();

  return {
    uaaId: userUaaId,
    userName: uname,
    email,
    groups: usersGroups,
    active: true,
    verified: false,
    origin: 'gsa.gov',
    userId: userUserId,
    ...rest,
  };
}

function uaaProfile(overrides) {
  return profileAttributes(overrides);
}

function uaaUser(overrides) {
  return userAttributes(overrides);
}

function createUAAIdentity(overrides) {
  const attributes = userAttributes(overrides);
  return UAAIdentity.create(attributes);
}

module.exports = {
  createUAAIdentity,
  uaaProfile,
  uaaUser,
};
