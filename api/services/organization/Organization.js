const {
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
} = require('../../models');

const UAAClient = require('../../utils/uaaClient');

/**
 * Not typing the Sequelize stuff...
 *
 * @typedef {object} UserType
 * @typedef {object} OrgType
 * @typedef {object} UAAIdentityType
 */

/**
 * @typedef {object} UAAInvite
 * @property {string} email
 * @property {string} userId
 * @property {string} origin
 * @property {boolean} success
 * @property {string=} errorCode
 * @property {string=} errorMessage
 * @property {string=} inviteLink
 */

module.exports = {

  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   * @param {string} targetUserEmail - the email address of the user to invite
   * @returns {PromiseLike<UAAInvite>}
   */
  async inviteUAAUser(currentUserUAAIdentity, targetUserEmail) {
    const uaaClient = new UAAClient();

    const { accessToken, refreshToken } = await uaaClient.refreshToken(
      currentUserUAAIdentity.refreshToken
    );

    await currentUserUAAIdentity.update({ accessToken, refreshToken });

    return uaaClient.inviteUserToUserGroup(targetUserEmail, accessToken);
  },

  /**
   * @param {string} uaaEmail
   * @returns {PromiseLike<UserType | null>}
   */
  findUAAUser(uaaEmail) {
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
   * @returns {PromiseLike<[UserType, (UAAInvite | undefined)]>}
   */
  async findOrCreateUAAUser(currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername = '') {
    let user = await this.findUAAUser(targetUserEmail);

    if (user) return [user];

    const invite = await this.inviteUAAUser(currentUserUAAIdentity, targetUserEmail);

    [user] = await User.findOrCreate({
      where: { username: targetUserGithubUsername && targetUserGithubUsername.toLowerCase() },
      defaults: { username: invite.email },
    });

    await user.createUAAIdentity({
      uaaId: invite.userId,
      userName: invite.email,
      email: invite.email,
      origin: invite.origin,
    });

    return [user, invite];
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {('manager'|'user')} orgRoleName
   * @param {string} targetUserEmail - the email address of the user to invite
   * @param {string=} targetUserGithubUsername
   * @returns {PromiseLike<[OrgType, (UAAInvite | undefined)]>}
   */
  async inviteUserToOrganization(
    currentUser, orgName, orgRoleName, targetUserEmail, targetUserGithubUsername
  ) {
    // The current user must have a UAA Identity to invite more users
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throw new Error(`Current user ${currentUser.username} must have a UAA Identity to invite a user to an organization.`);
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
      throw new Error(`Current user ${currentUser.username} must be a manager of the target organization to invite a user.`);
    }

    const role = await Role.findOne({ where: { name: orgRoleName } });

    if (!role) {
      throw new Error(`Invalid role name ${orgRoleName} provided, valid values are 'user' or 'manager'.`);
    }

    const [user, invite] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    await org.addUser(user, { through: { roleId: role.id } });

    return [org, invite];
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {string} targetUserEmail
   * @param {string=} targetUserGithubUsername
   * @returns {PromiseLike<[OrgType, (UAAInvite | undefined)]>}
   */
  async createOrganization(
    currentUser, orgName, targetUserEmail, targetUserGithubUsername
  ) {
    // The current user must have a UAA Identity to invite more users
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throw new Error(`Current user ${currentUser.username} must have a UAA Identity to invite a user to an organization.`);
    }

    const [user, invite] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    const managerRole = await Role.findOne({ name: 'manager' });

    const org = await Organization.create({ name: orgName });
    await org.addUser(user, { through: { roleId: managerRole.id } });

    return [org, invite];
  },
};
