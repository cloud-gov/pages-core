const { Organization, OrganizationRole, Role, User } = require('../../models');
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
  return org.OrganizationRoles.some(
    (or) => or.User.id === user.id && or.Role.name === 'manager',
  );
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
      currentUserUAAIdentity.refreshToken,
    );

    await currentUserUAAIdentity.update({
      accessToken,
      refreshToken,
    });

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
   * @param {string} uaaEmail
   * @returns {Promise<UserType | null>}
   */
  findUserByUAAIdentity(uaaEmail) {
    return User.byUAAEmail(uaaEmail).findOne();
  },

  /**
   * @param {UAAIdentityType} currentUserUAAIdentity
   * @param {string} targetUserEmail - the email address of the user to invite
   * if they are a current Federalist user
   *
   * @returns {Promise<[UserType, UAAClient.UAAUserAttributes]>}
   */
  async findOrCreateUAAUser(currentUserUAAIdentity, targetUserEmail) {
    let user = await this.findUserByUAAIdentity(targetUserEmail);

    if (user) {
      return [
        user,
        {
          email: user.UAAIdentity.email,
        },
      ];
    }

    const uaaUserAttributes = await this.inviteUAAUser(
      currentUserUAAIdentity,
      targetUserEmail,
    );

    if (!user) {
      user = await User.create({
        username: uaaUserAttributes.email,
      });
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
   * Used to create a new user when not running on behalf of a user
   * @param {string} targetUserEmail - the email address of the user to invite
   * if they are a current user
   *
   * @returns {Promise<[UserType, UAAClient.UAAUserAttributes]>}
   */
  async botFindOrCreateUAAUser(targetUserEmail) {
    const uaaClient = new UAAClient();
    const clientToken = await uaaClient.fetchClientToken({
      scope: 'scim.read,scim.invite,scim.write',
    });

    return this.findOrCreateUAAUser(clientToken, targetUserEmail);
  },

  /**
   *
   * @param {string} email
   * @param {string} orgName
   */

  async setupSiteEditorOrganization(email, orgName) {
    let org;
    const [user, uaaUserAttributes] = await this.botFindOrCreateUAAUser(email);

    org = await Organization.findOne({ where: { name: orgName } });

    if (!org) {
      org = await Organization.create({
        agency: 'gsa',
        name: orgName,
        isSandbox: false,
        isSelfAuthorized: false,
      });
    }

    await org.addRoleUser(user, 'manager');

    return { org, user, uaaUserAttributes };
  },

  /**
   *
   * @param {UserType} currentUser
   * @param {string} targetUserEmail
   */
  async resendInvite(currentUser, targetUserEmail) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(
        `Current user ${currentUser.username} must have a UAA Identity to invite a user.`,
      );
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
   * @param {boolean} isAdmin - called from the admin API
   * @returns {Promise<UAAClient.UAAUserAttributes>}
   */
  async inviteUserToOrganization(
    currentUser,
    organizationId,
    roleId,
    targetUserEmail,
    isAdmin = false,
  ) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(
        // eslint-disable-next-line max-len
        `Current user ${currentUser.username} must have a UAA Identity to invite a user to an organization.`,
      );
    }

    const org = await Organization.findOne({
      where: {
        id: organizationId,
      },
      include: [
        {
          model: OrganizationRole,
          include: [Role, User],
        },
      ],
    });

    if (!isAdmin && !hasManager(org, currentUser)) {
      throwError(
        // eslint-disable-next-line max-len
        `Current user ${currentUser.username} must be a Pages admin in UAA OR a manager of the target organization to invite a user.`,
      );
    }

    const role = await Role.findByPk(roleId);

    if (!role) {
      throwError(`Invalid role id ${roleId} provided.`);
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity,
      targetUserEmail,
    );

    await org.addUser(user, {
      through: {
        roleId: role.id,
      },
    });

    return uaaUserAttributes;
  },

  /**
   * @param {OrganizationParams} organizationParams
   * @param {UserType} currentUser
   * @param {string} targetUserEmail
   * @returns {Promise<[OrgType, UAAClient.UAAUserAttributes]>}
   */
  async createOrganization(organizationParams, currentUser, targetUserEmail) {
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    if (!currentUserUAAIdentity) {
      throwError(
        // eslint-disable-next-line max-len
        `Current user ${currentUser.username} must have a UAA Identity to create an organization.`,
      );
    }

    const [user, uaaUserAttributes] = await this.findOrCreateUAAUser(
      currentUserUAAIdentity,
      targetUserEmail,
    );

    const org = await Organization.create(organizationParams);
    await org.addRoleUser(user, 'manager');

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
