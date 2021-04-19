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
   * @param {string} accessToken
   * @param {('admin'|'user')} uaaRole
   * @param {string} uaaEmail
   * @returns {PromiseLike<UAAInvite>}
   */
  inviteUAAUser(accessToken, uaaRole, uaaEmail) {
    const uaa = new UAAClient(accessToken, uaaRole);
    return uaa.inviteUser(uaaEmail);
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
   * @param {string} uaaAccessToken
   * @param {('admin'|'user')} uaaRole
   * @param {string} uaaEmail
   * @param {string=} githubUsername
   * @returns {PromiseLike<UserType>}
   */
  async findOrCreateUAAUser(uaaAccessToken, uaaRole, uaaEmail, githubUsername = '') {
    let user = await this.findUAAUser(uaaEmail);

    if (user) return user;

    const uaaInvite = await this.inviteUAAUser(uaaAccessToken, uaaRole, uaaEmail);

    [user] = await User.findOrCreate({
      where: { username: githubUsername && githubUsername.toLowerCase() },
      defaults: { username: uaaInvite.email },
    });

    await user.createUAAIdentity({
      uaaId: uaaInvite.userId,
      userName: 'this is not provided by UAA', // TODO - something!
      email: uaaInvite.email,
      origin: uaaInvite.origin,
    });

    return user;
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {('manager'|'user')} orgRoleName
   * @param {string} userUAAEmail
   * @param {string=} userGithubUsername
   * @returns {PromiseLike<OrgType>}
   */
  async inviteUserToOrganization(
    currentUser, orgName, orgRoleName, userUAAEmail, userGithubUsername
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

    const user = await this.findOrCreateUAAUser(
      currentUserUAAIdentity.accessToken, 'user', userUAAEmail, userGithubUsername
    );

    await org.addUser(user, { through: { roleId: role.id } });

    return org;
  },

  /**
   * @param {UserType} currentUser
   * @param {string} orgName
   * @param {string} orgManagerUAAEmail
   * @param {string=} orgManagerGithubUsername
   * @returns {PromiseLike<OrgType>}
   */
  async createOrganization(
    currentUser, orgName, orgManagerUAAEmail, orgManagerGithubUsername
  ) {
    // The current user must have a UAA Identity to invite more users
    const currentUserUAAIdentity = await currentUser.getUAAIdentity();

    const user = await this.findOrCreateUAAUser(
      currentUserUAAIdentity.accessToken, 'admin', orgManagerUAAEmail, orgManagerGithubUsername
    );

    const managerRole = await Role.findOne({ name: 'manager' });

    const org = await Organization.create({ name: orgName });
    await org.addUser(user, { through: { roleId: managerRole.id } });

    return org;
  },
};
