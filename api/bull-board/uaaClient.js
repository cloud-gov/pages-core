const config = require('./config');
const HttpClient = require('../utils/httpClient');
const { uaa: uaaOptions } = require('../../config/passport');
const { uaaHostUrl } = require('../../config/env')

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
  constructor() {
    this.clientId = uaaOptions.options.clientID;
    this.clientSecret = uaaOptions.options.clientSecret;
    this.httpClient = new HttpClient(uaaHostUrl);
  }

  /**
   *
   * Public API
   *
   * These methods encapsulate some business logic and make multiple requests
   *
   */

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
   * @param {string} userId - a UAA user id
   * @param {string} clientToken - a client token with the `scim.read` scope
   *
   * Fetches a UAA user by id
   */
  async fetchUser(userId, clientToken) {
    const path = `/Users/${userId}`;
    const options = { token: clientToken };

    return this.request(path, options);
  }

  

  request(path, opts = {}) {
    const {
      body,
      form,
      method = 'get',
      params,
      token,
    } = opts;

    return this.httpClient.request({
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
      .catch((e) => { throw new Error(e); });
  }
}

module.exports = UAAClient;
