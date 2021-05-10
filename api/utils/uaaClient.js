const request = require('request');
const config = require('../../config');

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

class UAAClient {
  constructor() {
    this.clientId = uaaOptions.options.clientID;
    this.clientSecret = uaaOptions.options.clientSecret;
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
   *
   * Invites the target user to UAA and adds them to the `pages.user` UAA group
   */
  async inviteUserToUserGroup(targetUserEmail, userToken) {
    const groupName = 'pages.user';

    const clientToken = await this.fetchClientToken();

    const uaaUser = await this.fetchUserByEmail(targetUserEmail, clientToken);
    const isInGroup = uaaUser && this.userInGroup(uaaUser.groups, [groupName]);
    if (isInGroup) {
      return null;
    }

    const invite = uaaUser ? null : await this.inviteUser(targetUserEmail, userToken);

    const { origin } = invite || uaaUser;
    const userId = (invite && invite.userId) || uaaUser.id;

    const groupId = await this.fetchGroupId(groupName, clientToken);
    await this.addUserToGroup(groupId, { origin, userId }, userToken);

    return invite;
  }

  /**
   * @param {string} userId - a UAA user id
   * @param {[string]} groupNames - allowed UAA group names, ex: ['pages.user']
   *
   * Verifies that the UAA user is in the specified UAA group
   */
  async verifyUserGroup(userId, groupNames) {
    const clientToken = await this.fetchClientToken();
    const { groups, origin, verified } = await this.fetchUser(userId, clientToken);

    if (origin === 'cloud.gov' && !verified) {
      return false;
    }

    return this.userInGroup(groups, groupNames);
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
    return userGroups.filter(group => groupNames.includes(group.display)).length > 0;
  }

  /**
   *
   * Private API
   *
   * These methods each make one call to the api
   */

  /**
   * @param {string} groupId - a UAA group id
   * @param {{origin: string, userId: string}} userInfo - the origin and user id of the uaa user
   * @param {string} userToken - a user token with the `groups.update` scope
   *
   * Adds the UAA user to the specific UAA group, ignores an error if the user is a member.
   */
  async addUserToGroup(groupId, { origin, userId }, userToken) {
    const path = `/Groups/${groupId}/members`;
    const options = {
      body: { origin, type: 'USER', value: userId },
      method: 'POST',
      token: userToken,
    };

    try {
      return await this.request(path, options);
    } catch (error) {
      if (error.message === 'member_already_exists') {
        return null;
      }
      throw error;
    }
  }

  /**
   * @returns {Promise<string>} a client token
   *
   * Fetches a new client token with scopes matching the configured client `authorities`
   */
  async fetchClientToken() {
    const path = '/oauth/token';
    const options = {
      method: 'POST',
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        response_type: 'token',
      },
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
      params: { filter: `displayName eq "${groupName}"` },
      token: clientToken,
    };

    const { resources: [{ id }] } = await this.request(path, options);

    return id;
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
      params: { filter: `email eq "${email}"` },
      token: clientToken,
    };

    const { resources: [user] } = await this.request(path, options);

    return user;
  }

  /**
   * @param {string} userId - a UAA user id
   * @param {string} clientToken - a client token with the `scim.write` scope
   *
   * Fetches a UAA user by id
   */
  async fetchUser(userId, clientToken) {
    const path = `/Users/${userId}`;
    const options = { token: clientToken };

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
      body: { emails: [targetUserEmail] },
      method: 'POST',
      params: { redirect_uri: config.app.hostname },
      token: userToken,
    };

    const { new_invites: [invite] } = await this.request(path, options);
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

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
    } = await this.request(path, options);

    return { accessToken, refreshToken };
  }

  request(path, opts = {}) {
    return new Promise((resolve, reject) => {
      const callback = (error, response, body) => {
        if (error) {
          return reject(error);
        }

        let result = {};
        // I don't think we should have to do this, the responses should all be json strings.
        // However, nock seems to sometimes return a json string or an object, soooooo
        if (body) {
          result = typeof body === 'string'
            ? JSON.parse(body)
            : body;
        }

        if (result.error) {
          const msg = `${result.error}
          ${result.error_description}
          ${result.scope}`;
          return reject(new Error(msg));
        }

        if (response.statusCode > 399) {
          const errorMessage = body || `Received status code: ${response.statusCode}`;
          return reject(new Error(errorMessage));
        }

        return resolve(result);
      };

      const {
        body,
        form,
        method = 'GET',
        params,
        token,
      } = opts;

      const options = {
        baseUrl: config.env.uaaHostUrl,
        method: method.toUpperCase(),
        qs: params,
        uri: path,
      };

      if (token) {
        options.auth = { bearer: token };
      }

      if (body) {
        options.json = true;
        options.body = body;
      }

      if (form) {
        options.form = form;
      }

      request(options, callback);
    }).catch((e) => { throw new Error(e); });
  }
}

module.exports = UAAClient;
