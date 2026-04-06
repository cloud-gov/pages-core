const nock = require('nock');

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

module.exports = {
  getClientCredentials,
  getReqHeaders,
  getRefreshTokenBody,
  getRefreshToken200Response,
  nockRefreshTokenWithResponse,
};
