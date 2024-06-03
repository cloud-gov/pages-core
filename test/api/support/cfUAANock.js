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
 * @param {string} token
 * @param {{error:string}=} error
 */
function mockAddUserToGroup(groupId, { userId }, token, error) {
  const n = nock(uaaHost, tokenAuth(token))
    .post(`/Groups/${groupId}/members`, { origin: 'uaa', type: 'USER', value: userId });

  if (error) {
    return n.reply(400, error);
  }

  return n.reply(200, {});
}

/**
 * @param {string} returnAccessToken - the access token to return
 */
function mockFetchClientToken(returnAccessToken, scope) {
  const url = new URL(uaaConfig.tokenURL);

  return nock(url.origin)
    .post(url.pathname, {
      client_id: uaaConfig.clientID,
      client_secret: uaaConfig.clientSecret,
      grant_type: 'client_credentials',
      response_type: 'token',
      ...(scope && { scope }),
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
 * @param {string} groupId
 * @param {[object]} returnUsers
 * @param {string} token
 */
function mockFetchGroupMembers(groupId, returnUsers, token) {
  return nock(uaaHost, tokenAuth(token))
    .get(`/Groups/${groupId}/members`)
    .query({ returnEntities: true })
    .reply(200, returnUsers.map(u => ({ entity: u })));
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
 * @param {object?} profile - UAA user profile attributes
 */
function mockFetchUserByEmail(email, token, profile) {
  return nock(uaaHost, tokenAuth(token))
    .get('/Users')
    .query({ filter: `email eq "${email}"` })
    .reply(200, {
      resources: profile ? [profile] : [],
    });
}

/**
 * @param {string} email
 * @param {string} token
 */
function mockInviteUser(email, token, profile) {
  return nock(uaaHost, tokenAuth(token))
    .post('/invite_users', { emails: [email] })
    .query({ redirect_uri: config.app.hostname })
    .reply(200, {
      new_invites: profile ? [
        {
          email,
          success: true,
          inviteLink: '',
          ...profile,
        },
      ] : [],
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

function mockFailedExchange(code) {
  const url = new URL(uaaConfig.tokenURL);

  return nock(url.origin)
    .post(url.pathname, body => (
      body.code === code
      && body.grant_type === 'authorization_code'
      && body.client_id === uaaConfig.clientID
      && body.client_secret === uaaConfig.clientSecret
    ))
    .reply(401, {
      error: 'unauthorized',
      error_description: 'An Authentication object was not found in the SecurityContext'
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
  const profile = { groups: [groupName], userId: 'userId', origin: 'example.com' };

  mockFetchClientToken(clientToken);
  mockFetchUserByEmail(email, clientToken);
  mockInviteUser(email, userToken);
  mockFetchGroupId(groupName, groupId, clientToken);
  mockAddUserToGroup(groupId, profile, clientToken);
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
  mockFailedExchange,
  mockFetchClientToken,
  mockFetchGroupId,
  mockFetchGroupMembers,
  mockFetchUser,
  mockFetchUserByEmail,
  mockInviteUser,
  mockInviteUserToUserGroup,
  mockRefreshToken,
  mockVerifyUserGroup,
  mockServerErrorStatus,
};
