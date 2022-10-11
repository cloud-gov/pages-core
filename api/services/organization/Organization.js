const {
  Organization,
  OrganizationRole,
  Role,
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
 *
 * @typedef {object} OrganizationParams
 * @property {string} name
 * @property {string} agency
 * @property {boolean} isSandbox
 * @property {boolean} isSelfAuthorized
 */

function throwError(message) {
  throw new CustomError(message, 422);
}

function hasManager(org, user) {
  return org.OrganizationRoles.some(or => or.User.id === user.id && or.Role.name === 'manager');
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
    return uaaClient.verifyUserGroup(currentUserUAAIdentity.uaaId, ['pages.admin', 'pages.support']);
  },

  /**
   * @param {string} uaaEmail
   * @returns {Promise<UserType | null>}
   */
  findUserByUAAIdentity(uaaEmail) {
    return User.byUAAEmail(uaaEmail).findOne();
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
      return [user, { email: user.UAAIdentity.email }];
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
   * @param {number} organizationId
   * @param {number} roleId
   * @param {string} targetUserEmail - the email address of the user to invite
   * @param {string=} targetUserGithubUsername
   * @returns {Promise<UAAClient.UAAUserAttributes>}
   */
  async inviteUserToOrganization(
    currentUser, organizationId, roleId, targetUserEmail, targetUserGithubUsername
  ) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(`Current user ${currentUser.username} must have a UAA Identity to invite a user to an organization.`);
    }

    const [isAdmin, org] = await Promise.all([
      this.isUAAAdmin(currentUserUAAIdentity),
      Organization.findOne({
        where: { id: organizationId },
        include: [{
          model: OrganizationRole,
          include: [Role, User],
        }],
      }),
    ]);

    if (!isAdmin && !hasManager(org, currentUser)) {
      throwError(`Current user ${currentUser.username} must be a Pages admin in UAA OR a manager of the target organization to invite a user.`);
    }

    const role = await Role.findByPk(roleId);

    if (!role) {
      throwError(`Invalid role id ${roleId} provided.`);
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity, targetUserEmail, targetUserGithubUsername
    );

    await org.addUser(user, { through: { roleId: role.id } });

    return uaaUserAttributes;
  },

  /**
   * @param {OrganizationParams} organizationParams
   * @param {UserType} currentUser
   * @param {string} targetUserEmail
   * @param {string=} targetUserGithubUsername
   * @returns {Promise<[OrgType, UAAClient.UAAUserAttributes]>}
   */
  async createOrganization(
    organizationParams, currentUser, targetUserEmail, targetUserGithubUsername
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

    const managerRole = await Role.findOne({ where: { name: 'manager' } });

    const org = await Organization.create(organizationParams);
    await org.addUser(user, { through: { roleId: managerRole.id } });

    return [org, uaaUserAttributes];
  },

  /**
   * @param {OrganizationModel} organization The organization
   * @returns {Promise<OrgType>}
   */
  deactivateOrganization(organization) {
    return organization.update({ isActive: false });
  },

  /**
     * @param {OrganizationModel} organization The organization
     * @returns {Promise<OrgType>}
     */
  activateOrganization(organization) {
    return organization.update({ isActive: true });
  },
};
