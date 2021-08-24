/* eslint-disable no-console */
const UAAClient = require('../api/utils/uaaClient');
const { User } = require('../api/models');

async function createUser(uaaUser) {
  const {
    emails: [{ value: email }], id: uaaId, origin, userName,
  } = uaaUser;

  const user = await User.create({ email, username: userName });
  await user.createUAAIdentity({
    uaaId, email, origin, userName,
  });
  return user;
}

async function bootstrapAdmins(groupName) {
  const uaaClient = new UAAClient();
  const clientToken = await uaaClient.fetchClientToken();
  const groupId = await uaaClient.fetchGroupId(groupName, clientToken);
  const uaaUsers = await uaaClient.fetchGroupMembers(groupId, clientToken);
  return Promise.all(uaaUsers.map(createUser));
}

const groupName = process.argv[2];
if (!groupName) {
  console.log('Usage: node bootstrap-admins.js <groupName>');
  process.exit(1);
}

try {
  bootstrapAdmins(groupName)
    .then(users => console.log(`Bootstrapped ${users.length} users.`));
} catch (err) {
  console.error(err);
  process.exit(1);
}
