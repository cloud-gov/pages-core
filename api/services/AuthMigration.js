const Mailer = require('./mailer');
const UAAClient = require('../utils/uaaClient');

module.exports.migrateUser = async function migrateUser(user, uaaEmail) {
  const uaaClient = new UAAClient();
  const clientToken = await uaaClient.fetchClientToken();
  const {
    email,
    inviteLink,
    origin,
    userId: uaaId,
  } = await uaaClient.inviteUserToUserGroup(uaaEmail, clientToken);

  await user.createUAAIdentity({
    email,
    origin,
    uaaId,
    userName: email,
  });

  if (inviteLink) {
    await Mailer.sendUAAInvite(email, inviteLink);
  }
};
