const { mock } = require('fetch-mock');
const nock = require('nock');
const config = require('../../../config');

const { options: uaaConfig } = config.passport.uaa;

const { uaaHost } = config.env;

function tokenAuth(token) {
  return {
    reqheaders: {
      authorization: `Bearer ${token}`,
    },
  };
}

/**
 *
 * UAA Client api request mocks
 *
 */

/**
 * @param {string} groupId
 * @param {{origin:string, userId: string}}
 * @param {string} token
 */
function mockAddUserToGroup(groupId, { origin, userId }, token) {
  return nock(uaaHost, tokenAuth(token))
    .post(`/Groups/${groupId}/members`, { origin, type: 'USER', value: userId })
    .reply(200, {});
}

/**
 * @param {string} returnAccessToken - the access token to return
 */
function mockFetchClientToken(returnAccessToken) {
  const url = new URL(uaaConfig.tokenURL);

  return nock(url.origin)
    .post(url.pathname, {
      client_id: uaaConfig.clientID,
      client_secret: uaaConfig.clientSecret,
      grant_type: 'client_credentials',
      response_type: 'token',
    })
    .reply(200, { access_token: returnAccessToken });
}

/**
 * @param {string} groupName
 * @param {string} returnGroupId
 * @param {string} token
 */
function mockFetchGroupId(groupName, returnGroupId, token) {
  return nock(uaaHost, tokenAuth(token))
    .get('/Groups')
    .query({ filter: `displayName eq "${groupName}"` })
    .reply(200, {
      resources: [{ id: returnGroupId }],
    });
}

/**
 * @param {string} userId
 * @param {object} profile  - UAA user profile attributes
 * @param {string} token
 */
function mockFetchUser(userId, profile, token) {
  return nock(uaaHost, tokenAuth(token))
    .get(`/Users/${userId}`)
    .reply(200, { ...profile });
}

/**
 * @param {string} email
 * @param {string} token
 */
function mockInviteUser(email, token) {
  return nock(uaaHost, tokenAuth(token))
    .post('/invite_users', { emails: [email] })
    .query({ redirect_uri: config.app.hostname })
    .reply(200, {
      new_invites: [
        {
          email,
          userId: 'userId',
          origin: 'example.com',
          success: true,
          inviteLink: '',
        },
      ],
    });
}

/**
 * @param {string} token - the initial refresh token
 * @param {string} returnAccessToken - the access token to return
 * @param {string} returnRefreshToken - the refresh token to return
 *
 * Mocks the refresh token endpoint
 */
function mockRefreshToken(token, returnAccessToken, returnRefreshToken) {
  const url = new URL(uaaConfig.tokenURL);
  return nock(url.origin)
    .post(url.pathname, {
      client_id: uaaConfig.clientID,
      client_secret: uaaConfig.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token,
    })
    .reply(200, {
      access_token: returnAccessToken,
      refresh_token: returnRefreshToken,
    });
}

/**
 *
 * OAuth request mocks
 *
 */

function mockUserProfile(profile, accessToken) {
  const url = new URL(uaaConfig.userURL);
  return nock(url.origin)
    .get(url.pathname)
    .query({ access_token: accessToken })
    .reply(200, profile);
}

function mockExchangeToken(code, accessToken) {
  const url = new URL(uaaConfig.tokenURL);

  return nock(url.origin)
    .post(url.pathname, body => (
      body.code === code
      && body.grant_type === 'authorization_code'
      && body.client_id === uaaConfig.clientID
      && body.client_secret === uaaConfig.clientSecret
    ))
    .reply(200, {
      access_token: accessToken,
      refresh_token: 'def456',
      expires_in: 10,
    });
}

/**
 *
 * Flows that require multiple mocks
 *
 */

function mockUAAAuth(profile, code) {
  const accessToken = 'accessToken';
  mockExchangeToken(code, accessToken);
  mockUserProfile(profile, accessToken);
}

/**
 * @param {string} userId
 * @param {object} profile
 */
function mockVerifyUserGroup(userId, profile) {
  const token = 'token';
  mockFetchClientToken(token);
  mockFetchUser(userId, profile, token);
}

function mockInviteUserToUserGroup(email, userToken, groupName) {
  const clientToken = 'token';
  const groupId = '1';

  mockInviteUser(email, userToken);
  mockFetchClientToken(clientToken);
  mockFetchGroupId(groupName, groupId, clientToken);
  mockAddUserToGroup(groupId, { userId: 'userId', origin: 'example.com' }, userToken);
}

/**
 *
 * Error Helpers
 *
 */

/**
 *
 * @param {number} status
 * @param {string} path
 * @param {{error:string}} message
 * @param {string} accessToken
 * @param {string=} method
 */
function mockServerErrorStatus(status, path, message, accessToken, method = 'get') {
  const httpMethod = method.toLowerCase();
  return nock(uaaHost, tokenAuth(accessToken))[httpMethod](path)
    .reply(status, message);
}

module.exports = {
  mockAddUserToGroup,
  mockUAAAuth,
  mockFetchClientToken,
  mockFetchGroupId,
  mockFetchUser,
  mockInviteUser,
  mockInviteUserToUserGroup,
  mockRefreshToken,
  mockVerifyUserGroup,
  mockServerErrorStatus,
};
