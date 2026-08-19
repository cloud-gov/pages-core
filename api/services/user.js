const UAAClient = require('../utils/uaaClient');
const { UAAIdentity } = require('../models');

const uaaClient = new UAAClient();

async function migrateUserLoginGov(uaaEmail) {
  const clientToken = await uaaClient.fetchClientToken({
    scope: 'scim.read,scim.invite,scim.write',
  });

  const uaaUser = await uaaClient.fetchUserOriginByEmail(uaaEmail, clientToken);
  if (uaaUser.resources && uaaUser.resources.length && uaaUser.resources.length > 1) {
    const uaaLoginUser = uaaUser.resources.find((user) => user.origin === 'login.gov');
    const uaaUserToBeUpdated = uaaUser.resources.find(
      (user) => user.origin !== 'login.gov',
    );

    if (!uaaLoginUser) {
      return false;
    }
    const groupName = 'pages.user';

    const groupId = await uaaClient.fetchGroupId(groupName, clientToken);
    await uaaClient.addUserToGroup(groupId, { userId: uaaLoginUser.id }, clientToken);

    const pageslUser = await UAAIdentity.findOne({
      where: {
        uaaId: uaaUserToBeUpdated.id,
      },
    });
    if (!pageslUser) {
      return false;
    }
    await pageslUser.update({ uaaId: uaaLoginUser.id, origin: uaaLoginUser.origin });

    return true;
  }
  return false;
}

module.exports = {
  async updateGitLabTokens(
    user,
    { accessToken, refreshToken, expiresIn, createdAt, gitlabUserId },
  ) {
    return user.update({
      gitlabToken: accessToken,
      gitlabRefreshToken: refreshToken,
      gitlabExpiresAt:
        accessToken && refreshToken ? new Date((createdAt + expiresIn) * 1000) : null,
      gitlabUserId: gitlabUserId ?? user.gitlabUserId,
    });
  },

  async resetGitLabTokens(user) {
    return user.update({
      gitlabToken: null,
      gitlabRefreshToken: null,
      gitlabExpiresAt: null,
      gitlabUserId: null,
    });
  },
  migrateUserLoginGov,
};
