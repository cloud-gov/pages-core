const nock = require('nock');
const { getUrlEncodedPath } = require('../../../api/services/GitLab');
const config = require('../../../config');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
gitlabConfig.clientID = 'mock-client-id';
gitlabConfig.clientSecret = 'mock-client-secret';
gitlabConfig.callbackURL = 'https://localhost:1337/auth/gitlab/callback';
gitlabConfig.baseURL = 'https://workshop.cloud.gov';

const getClientCredentials = (gitlabConfig) => ({
  client_id: gitlabConfig.clientID,
  client_secret: gitlabConfig.clientSecret,
});

const getHeaders = (accessToken) => {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Bearer ${accessToken}`,
  };
};

const getReqHeaders = (accessToken) => {
  return { reqheaders: getHeaders(accessToken) };
};

const getRefreshTokenBody = (gitlabConfig, refreshToken) => {
  return {
    ...getClientCredentials(gitlabConfig),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    redirect_uri: gitlabConfig.callbackURL,
  };
};

const getRefreshToken200Response = ({
  access_token,
  expires_in,
  refresh_token,
  created_at,
} = {}) => ({
  access_token: access_token || 'new-access-token',
  expires_in: expires_in || 7200,
  refresh_token: refresh_token || 'new-refresh-token',
  created_at: created_at || 1774285431,
});

const getRefreshToken400Response = () => ({
  error: 'invalid_grant',
  error_description:
    'THIS IS NOCK RESPONSE: ' +
    'The provided authorization grant is invalid, expired, revoked, ' +
    'does not match the redirection URI used in the authorization request, ' +
    'or was issued to another client.',
});

function nockRefreshTokenWithResponse(
  gitlabConfig,
  accessToken,
  refreshToken,
  responseStatusCode,
  response,
) {
  return nock(gitlabConfig.baseURL, getReqHeaders(accessToken))
    .post('/oauth/token', getRefreshTokenBody(gitlabConfig, refreshToken))
    .reply(responseStatusCode, response);
}

function getNockGetProjectUser(
  gitlabToken,
  gitlabUserId,
  sourceCodeUrl,
  responseStatus,
  accessLevel,
) {
  const result = nock(gitlabConfig.baseURL, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${gitlabToken}`,
  })
    .get(
      `/api/v4/projects/${getUrlEncodedPath(sourceCodeUrl)}/members/all/${gitlabUserId}`,
    )
    .reply(
      responseStatus,
      accessLevel
        ? {
            access_level: accessLevel,
          }
        : {},
    );

  return result;
}

module.exports = {
  getClientCredentials,
  getReqHeaders,
  getRefreshTokenBody,
  getRefreshToken200Response,
  getRefreshToken400Response,
  getNockGetProjectUser,
  nockRefreshTokenWithResponse,
};
