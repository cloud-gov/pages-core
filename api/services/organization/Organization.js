const {
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
} = require('../../models');
const { CustomError } = require('../../utils/validators');
const UAAClient = require('../../utils/uaaClient');

/**
 * Not typing the Sequelize stuff...
 *
 * @typedef {object} UserType
 * @typedef {object} OrgType
 * @typedef {object} UAAIdentityType
 */

function throwError(message) {
  throw new CustomError(message, 422);
}

module.exports = {
  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   *
   * Refreshes and saves user access token
   */
  async refreshToken(currentUserUAAIdentity) {
    const uaaClient = new UAAClient();

    const { accessToken, refreshToken } = await uaaClient.refreshToken(
      currentUserUAAIdentity.refreshToken
    );

    await currentUserUAAIdentity.update({ accessToken, refreshToken });

    return accessToken;
  },

  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   * @param {string} targetUserEmail - the email address of the user to invite
   * @returns {Promise<UAAClient.UAAUserAttributes>}
   */
  async inviteUAAUser(currentUserUAAIdentity, targetUserEmail) {
    const accessToken = await this.refreshToken(currentUserUAAIdentity);

    const uaaClient = new UAAClient();
    return uaaClient.inviteUserToUserGroup(targetUserEmail, accessToken);
  },

  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   */
  async isUAAAdmin(currentUserUAAIdentity) {
    const uaaClient = new UAAClient();
    return uaaClient.verifyUserGroup(currentUserUAAIdentity.uaaId, ['pages.admin']);
  },

  /**
   * @param {string} uaaEmail
   * @returns {Promise<UserType | null>}
   */
  findUserByUAAIdentity(uaaEmail) {
    return User.findOne({
      include: [{
        model: UAAIdentity,
        where: { email: uaaEmail },
        required: true,
      }],
    });
  },

  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   * @param {string} targetUserEmail - the email address of the user to invite
   * @param {string=} targetUserGithubUsername - the github username of the user to invite,
   * if they are a current Federalist user
   *
   * @returns {Promise<[UserType, UAAClient.UAAUserAttributes]>}
   */
  async findOrCreateUAAUser(currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername = '') {
    let user = await this.findUserByUAAIdentity(targetUserEmail);

    if (user) {
      return [user];
    }

    const uaaUserAttributes = await this.inviteUAAUser(currentUserUAAIdentity, targetUserEmail);

    user = await User.findOne({
      where: { username: targetUserGithubUsername && targetUserGithubUsername.toLowerCase() },
    });

    if (!user) {
      user = await User.create({ username: uaaUserAttributes.email });
    }

    await user.createUAAIdentity({
      uaaId: uaaUserAttributes.userId,
      userName: uaaUserAttributes.email,
      email: uaaUserAttributes.email,
      origin: uaaUserAttributes.origin,
    });

    return [user, uaaUserAttributes];
  },

  /**
   *
   * @param {UserType} currentUser
   * @param {string} targetUserEmail
   */
  async resendInvite(currentUser, targetUserEmail) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(`Current user ${currentUser.username} must have a UAA Identity to invite a user.`);
    }

    const accessToken = await this.refreshToken(currentUserUAAIdentity);

    const uaaClient = new UAAClient();
    return uaaClient.inviteUser(targetUserEmail, accessToken);
  },

  /**
   * @param {UserType} currentUser
   * @param {string} targetUserEmail - the email address of the user to invite
   * @param {string=} targetUserGithubUsername
   * @returns {Promise<[UserType, UAAClient.UAAUserAttributes]>}
   */
  async inviteUserToPlatform(currentUser, targetUserEmail, targetUserGithubUsername) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(`Current user ${currentUser.username} must have a UAA Identity to invite a user.`);
    }

    const isAdmin = await this.isUAAAdmin(currentUserUAAIdentity);

    if (!isAdmin) {
      throwError(`Current user ${currentUser.username} must be a Pages admin in UAA to invite a user.`);
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    return [user, uaaUserAttributes];
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {('manager'|'user')} orgRoleName
   * @param {string} targetUserEmail - the email address of the user to invite
   * @param {string=} targetUserGithubUsername
   * @returns {Promise<[OrgType, UAAClient.UAAUserAttributes>}
   */
  async inviteUserToOrganization(
    currentUser, orgName, orgRoleName, targetUserEmail, targetUserGithubUsername
  ) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(`Current user ${currentUser.username} must have a UAA Identity to invite a user to an organization.`);
    }

    // The current user must have the `manager` role on the target organization
    const org = await Organization.findOne({
      where: { name: orgName },
      include: [{
        model: OrganizationRole,
        required: true,
        include: [
          {
            model: User,
            where: { id: currentUser.id },
            required: true,
          },
          {
            model: Role,
            where: { name: 'manager' },
            required: true,
          },
        ],
      }],
    });

    if (!org) {
      throwError(`Current user ${currentUser.username} must be a manager of the target organization to invite a user.`);
    }

    const role = await Role.findOne({ where: { name: orgRoleName } });

    if (!role) {
      throwError(`Invalid role name ${orgRoleName} provided, valid values are 'user' or 'manager'.`);
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    await org.addUser(user, { through: { roleId: role.id } });

    return [org, uaaUserAttributes];
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {string} targetUserEmail
   * @param {string=} targetUserGithubUsername
   * @returns {Promise<[OrgType, UAAClient.UAAUserAttributes]>}
   */
  async createOrganization(
    currentUser, orgName, targetUserEmail, targetUserGithubUsername
  ) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(`Current user ${currentUser.username} must have a UAA Identity to create an organization.`);
    }

    const isAdmin = await this.isUAAAdmin(currentUserUAAIdentity);

    if (!isAdmin) {
      throwError(`Current user ${currentUser.username} must be a Pages admin in UAA to create an organization.`);
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    const managerRole = await Role.findOne({ name: 'manager' });

    const org = await Organization.create({ name: orgName });
    await org.addUser(user, { through: { roleId: managerRole.id } });

    return [org, uaaUserAttributes];
  },
};
