const config = require('../../config');
const HttpClient = require('./httpClient');

const uaaOptions = config.passport.uaa;

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

/**
 * @typedef {object} UAAUserAttributes
 * @property {string} userId
 * @property {string} email
 * @property {string} origin
 * @property {string=} inviteLink
 */

/**
 * A wrapper around the UAA API
 */
class UAAClient {
  constructor(
    clientID = uaaOptions.options.clientID,
    clientSecret = uaaOptions.options.clientSecret,
  ) {
    this.clientId = clientID;
    this.clientSecret = clientSecret;
    this.httpClient = new HttpClient(config.env.uaaHostUrl);
  }

  /**
   *
   * Public API
   *
   * These methods encapsulate some business logic and make multiple requests
   *
   */

  /**
   * @param {string} targetUserEmail - the email address of the user to add
   * @param {string} userToken - a user token with the `scim.invite` scope
   * @returns {UAAUserAttributes} - User or invite attributes
   *
   * Invites the target user to UAA and adds them to the `pages.user` UAA group
   */
  async inviteUserToUserGroup(targetUserEmail, userToken) {
    let userInviteAttributes;

    const groupName = 'pages.user';

    const clientToken = await this.fetchClientToken({
      scope: 'scim.read,scim.invite,scim.write',
    });

    const uaaUser = await this.fetchUserByEmail(targetUserEmail, clientToken);
    if (uaaUser) {
      userInviteAttributes = {
        userId: uaaUser.id,
        email: uaaUser.userName,
        origin: uaaUser.origin,
      };

      const isInGroup = this.userInGroup(uaaUser.groups, [groupName]);

      if (isInGroup) {
        return userInviteAttributes;
      }
    } else {
      const invite = await this.inviteUser(targetUserEmail, userToken);
      userInviteAttributes = {
        userId: invite.userId,
        email: invite.email,
        origin: invite.origin,
        inviteLink: invite.inviteLink,
      };
    }

    const groupId = await this.fetchGroupId(groupName, clientToken);
    await this.addUserToGroup(groupId, userInviteAttributes, clientToken);

    return userInviteAttributes;
  }

  /**
   * @param {string} targetUserEmail - the email address of the user to add
   * @returns {UAAUserAttributes} - User or invite attributes
   *
   * Used by our backend to add a user to UAA's pages.user group
   * when the invite cannot be on behalf of a user.
   * This would be used in a webhook or scheduled jobs
   */
  async botInviteUser(targetUserEmail) {
    const clientToken = await this.fetchClientToken({
      scope: 'scim.read,scim.invite,scim.write',
    });

    return this.inviteUserToUserGroup(targetUserEmail, clientToken);
  }

  /**
   *
   * Utility
   *
   */

  /**
   * @param {[{display: string}]} userGroups - groups that the user belongs to
   * @param {[string]} groupNames - allowed UAA group names, ex: ['pages.user']
   */
  userInGroup(userGroups, groupNames) {
    return userGroups.some((group) => groupNames.includes(group.display));
  }

  /**
   *
   * Private API
   *
   * These methods each make one call to the api
   */

  /**
   * @param {string} groupId - a UAA group id
   * @param {{origin: string, userId: string}} userInfo
   * - the origin and user id of the uaa user
   * @param {string} clientToken - a client token with the `scim.write` scope
   *
   * Adds the UAA user to the specific UAA group,
   * ignores an error if the user is a member.
   */
  async addUserToGroup(groupId, { userId }, clientToken) {
    const path = `/Groups/${groupId}/members`;
    const options = {
      body: {
        origin: 'uaa',
        type: 'USER',
        value: userId,
      },
      method: 'POST',
      token: clientToken,
    };

    try {
      return await this.request(path, options);
    } catch (error) {
      if (error.message.includes('member_already_exists')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * @returns {Promise<string>} a client token
   *
   * Fetches a new client token with scopes matching the configured client `authorities`
   * @param {{scope: string}} - the form options for the client token
   */
  async fetchClientToken({ scope } = {}) {
    const form = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
      response_type: 'token',
      ...(scope && { scope }),
    };

    const path = '/oauth/token';
    const options = {
      method: 'POST',
      form,
    };

    const { access_token: accessToken } = await this.request(path, options);

    return accessToken;
  }

  /**
   * @param {string} groupName - a uaa group name, ex: `pages.user`
   * @param {string} clientToken - a client token with the `scim.read` scope
   * @returns {Promise<string>} the uaa group id
   *
   * Fetches the UAA group id for the specified group name
   */
  async fetchGroupId(groupName, clientToken) {
    const path = '/Groups';
    const options = {
      params: {
        filter: `displayName eq "${groupName}"`,
      },
      token: clientToken,
    };

    const {
      resources: [{ id }],
    } = await this.request(path, options);

    return id;
  }

  /**
   * @param {string} groupId - a uaa group id
   * @param {string} clientToken - a client token with the `scim.read` scope
   * @returns {Promise<object>} the uaa users that are members of the group
   *
   * Fetches the UAA users that are members of the group specified group id
   */
  async fetchGroupMembers(groupId, clientToken) {
    const path = `/Groups/${groupId}/members`;
    const options = {
      params: {
        returnEntities: true,
      },
      token: clientToken,
    };

    const response = await this.request(path, options);
    return response.map(({ entity }) => entity);
  }

  /**
   * @param {string} email - a UAA user email
   * @param {string} clientToken - a client token with the `scim.read` scope
   *
   * Fetches a UAA user by email
   */
  async fetchUserByEmail(email, clientToken) {
    const path = '/Users';
    const options = {
      params: {
        filter: `email eq "${email}"`,
      },
      token: clientToken,
    };

    const {
      resources: [user],
    } = await this.request(path, options);

    return user;
  }

  /**
   * @param {string} userId - a UAA user id
   * @param {string} clientToken - a client token with the `scim.read` scope
   *
   * Fetches a UAA user by id
   */
  async fetchUser(userId, clientToken) {
    const path = `/Users/${userId}`;
    const options = {
      token: clientToken,
    };

    return this.request(path, options);
  }

  /**
   * @param {string} targetUserEmail - the email address of the user to add
   * @param {string} userToken - a user token with the `scim.invite` scope
   * @returns {Promise<UAAInvite>}
   */
  async inviteUser(targetUserEmail, userToken) {
    const path = '/invite_users';
    const options = {
      body: {
        emails: [targetUserEmail],
      },
      method: 'POST',
      params: {
        redirect_uri: config.app.hostname,
      },
      token: userToken,
    };

    const {
      new_invites: [invite],
    } = await this.request(path, options);
    return invite;
  }

  /**
   * @param {string} token - a user refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   * an object containing a `refreshToken` and `accessToken` for the user
   */
  async refreshToken(token) {
    const path = '/oauth/token';
    const options = {
      method: 'POST',
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token,
      },
    };

    const { access_token: accessToken, refresh_token: refreshToken } = await this.request(
      path,
      options,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  request(path, opts = {}) {
    const { body, form, method = 'get', params, token } = opts;

    return this.httpClient
      .request({
        data: body || (form && new URLSearchParams(form).toString()),
        headers: token && {
          Authorization: `Bearer ${token}`,
        },
        method,
        params,
        url: path,
      })
      .then((response) => {
        if (response.data.error) {
          const msg = `${response.data.error}
          ${response.data.error_description || ''}
          ${response.data.scope || ''}`.trim();
          throw new Error(msg);
        }
        return response.data;
      })
      .catch((e) => {
        throw new Error(e);
      });
  }
}

module.exports = UAAClient;
