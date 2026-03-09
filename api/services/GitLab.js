const config = require('../../config/index.js');
const { logger } = require('../../winston');

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;

const getHeaders = (user) => {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Bearer ${user.gitlabToken}`,
  };
};

const getClientCredentials = (_gitlabConfig) => {
  return {
    client_id: _gitlabConfig.clientID,
    client_secret: _gitlabConfig.clientSecret,
  };
};

//  parameters = 'client_id=APP_ID&refresh_token=REFRESH_TOKEN
//  &grant_type=refresh_token&redirect_uri=REDIRECT_URI'
//   RestClient.post 'https://gitlab.example.com/oauth/token', parameters
const refreshToken = async (user) => {
  return fetch(`${gitlabConfig.baseURL}/oauth/token`, {
    method: 'POST',
    headers: getHeaders(user),
    body: new URLSearchParams({
      ...getClientCredentials(gitlabConfig),
      refresh_token: user.gitlabRefreshToken,
      grant_type: 'refresh_token',
      redirect_uri: gitlabConfig.callbackURL,
    }),
  });
};

// parameters = 'client_id=APP_ID&client_secret=APP_SECRET&token=TOKEN'
// RestClient.post 'https://gitlab.example.com/oauth/revoke', parameters
const revokeToken = async (user, token, tokenType) => {
  if (!token) return;

  try {
    const revokeResponse = await fetch(`${gitlabConfig.baseURL}/oauth/revoke`, {
      method: 'POST',
      headers: getHeaders(user),
      body: new URLSearchParams({
        ...getClientCredentials(gitlabConfig),
        token: `${token}`,
      }),
    });

    if (!revokeResponse.ok) {
      logger.warn(
        `GitLab: Failed to revoke GitLab ${tokenType}: ${revokeResponse.status}`,
        await revokeResponse.json(),
      );
    }
  } catch (error) {
    logger.error(
      `GitLab: Error revoking GitLab ${tokenType}.`,
      error.message,
      error.stack,
    );
  }
};

const revokeUserGitLabTokens = async (user) => {
  try {
    await revokeToken(user, user.gitlabToken, 'access token');
    await revokeToken(user, user.gitlabRefreshToken, 'refresh token');

    const refreshResponse = await refreshToken(user);
    const refreshResponseData = await refreshResponse.json();
    if (refreshResponse.status !== 400 || refreshResponseData.error !== 'invalid_grant') {
      logger.warn(
        `GitLab: Unexpected refresh response after revoke: ${refreshResponse.status}`,
        refreshResponseData,
      );
    }
  } catch (error) {
    logger.error('GitLab: Error revoking GitLab tokens.', error.message, error.stack);
  }
};

module.exports = {
  revokeUserGitLabTokens,
  refreshToken,
};
