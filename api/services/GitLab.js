const { logger } = require('../../winston');
const {
  gitlabLogError,
  gitlabLogResponseError,
  gitlabLogUserInfo,
} = require('../utils/gitlabLogger');
const config = require('../../config');
const OAUTH_PREFIX = 'oauth2';

const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded';
const CONTENT_TYPE_JSON = 'application/json';

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
const normalizeUrl = (gitlabConfigBaseURL) => gitlabConfigBaseURL?.replace(/\/$/, '');
const getNormalizedBaseUrl = () => normalizeUrl(gitlabConfig.baseURL);
const getBaseUrl = () => getNormalizedBaseUrl();
const getNormalizedBaseUrlWithOAuthToken = (userOAuthAccessToken) =>
  getNormalizedBaseUrl().replace(
    'https://',
    `https://${OAUTH_PREFIX}:${userOAuthAccessToken}@`,
  );
const getApiUrl = (path) => `${getNormalizedBaseUrl()}/api/v4/${path}`;

const getHeaders = (userOAuthAccessToken, contentType) => ({
  Authorization: `Bearer ${userOAuthAccessToken}`,
  Accept: 'application/json',
  ...(contentType && { 'Content-Type': contentType }),
});

const getClientCredentials = (_gitlabConfig) => ({
  client_id: _gitlabConfig.clientID,
  client_secret: _gitlabConfig.clientSecret,
});

const getUrlEncodedPath = (sourceCodeUrl) =>
  encodeURIComponent(sourceCodeUrl.replace(`${getNormalizedBaseUrl()}/`, ''));

const fetchRefreshUserOAuthTokens = async (user) =>
  await fetch(`${getNormalizedBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: getHeaders(user.gitlabToken, CONTENT_TYPE_URL_ENCODED),
    body: new URLSearchParams({
      ...getClientCredentials(gitlabConfig),
      refresh_token: user.gitlabRefreshToken,
      grant_type: 'refresh_token',
      redirect_uri: gitlabConfig.callbackURL,
    }),
  });

const fetchAddWebhook = async (userOAuthAccessToken, sourceCodeUrl, webhookEndpoint) =>
  fetch(getApiUrl(`projects/${getUrlEncodedPath(sourceCodeUrl)}/hooks`), {
    method: 'POST',
    headers: getHeaders(userOAuthAccessToken, CONTENT_TYPE_JSON),
    body: JSON.stringify({
      url: webhookEndpoint,
      push_events: true,
      branch_filter_strategy: 'all_branches',
      token: config.webhook.gitlabSecret,
    }),
  });

const fetchWebhooks = async (userOAuthAccessToken, sourceCodeUrl) =>
  fetch(getApiUrl(`projects/${getUrlEncodedPath(sourceCodeUrl)}/hooks`), {
    method: 'GET',
    headers: getHeaders(userOAuthAccessToken),
  });

const fetchGetProject = async (userOAuthAccessToken, sourceCodeUrl) =>
  fetch(getApiUrl(`projects/${getUrlEncodedPath(sourceCodeUrl)}`), {
    method: 'GET',
    headers: getHeaders(userOAuthAccessToken),
  });

const fetchProjectUser = async (userOAuthAccessToken, sourceCodeUrl, userId) =>
  fetch(getApiUrl(`projects/${getUrlEncodedPath(sourceCodeUrl)}/members/all/${userId}`), {
    method: 'GET',
    headers: getHeaders(userOAuthAccessToken),
  });

const fetchUser = async (userOAuthAccessToken) =>
  fetch(getApiUrl(`user`), {
    method: 'GET',
    headers: getHeaders(userOAuthAccessToken),
  });

const fetchPostCommitState = async (userOAuthAccessToken, sourceCodeUrl, options) =>
  fetch(
    getApiUrl(
      // eslint-disable-next-line max-len
      `projects/${getUrlEncodedPath(sourceCodeUrl)}/statuses/${options.sha}?state=${options.state}`,
    ),
    {
      method: 'POST',
      headers: getHeaders(userOAuthAccessToken, CONTENT_TYPE_URL_ENCODED),
      body: new URLSearchParams({
        state: options.state, // pending, running, success, failed, canceled, skipped
        target_url: options.target_url,
        description: options.description,
        context: options.context,
      }),
    },
  );

const fetchCreateProject = async (
  userOAuthAccessToken,
  namespaceId,
  projectName,
  importUrl,
) =>
  fetch(getApiUrl(`projects`), {
    method: 'POST',
    headers: getHeaders(userOAuthAccessToken, CONTENT_TYPE_JSON),
    body: JSON.stringify({
      path: projectName,
      import_url: `${importUrl?.replace(
        getNormalizedBaseUrl(),
        getNormalizedBaseUrlWithOAuthToken(userOAuthAccessToken),
      )}.git`,
      namespace_id: namespaceId,
    }),
  });

const fetchGetNamespace = async (userOAuthAccessToken, namespace) =>
  fetch(getApiUrl(`namespaces/${getUrlEncodedPath(namespace)}`), {
    method: 'GET',
    headers: getHeaders(userOAuthAccessToken),
  });

const fetchDeleteWebhook = async (userOAuthAccessToken, sourceCodeUrl, webhookId) =>
  fetch(getApiUrl(`projects/${getUrlEncodedPath(sourceCodeUrl)}/hooks/${webhookId}`), {
    method: 'DELETE',
    headers: getHeaders(userOAuthAccessToken),
  });

const revokeToken = async (user, token, tokenType) => {
  if (!token) return;

  try {
    const revokeResponse = await fetch(`${getNormalizedBaseUrl()}/oauth/revoke`, {
      method: 'POST',
      headers: getHeaders(user.gitlabToken, CONTENT_TYPE_URL_ENCODED),
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

const revokeUserOAuthTokens = async (user, resetUserOAuthTokens) => {
  try {
    await revokeToken(user, user.gitlabToken, 'access token');
    await revokeToken(user, user.gitlabRefreshToken, 'refresh token');

    const response = await fetchRefreshUserOAuthTokens(user);
    const data = await response.json();
    if (response.status !== 400 || data.error !== 'invalid_grant') {
      logger.warn(
        // eslint-disable-next-line max-len
        `GitLab: Unexpected token refresh response after tokens were revoked: ${response.status}`,
        data,
      );
    }
  } catch (error) {
    logger.error('GitLab: Error revoking GitLab tokens.', error.message, error.stack);
  }

  resetUserOAuthTokens(user);
};

const getProject = async (user, sourceCodeUrl, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchGetProject(userOAuthAccessToken, sourceCodeUrl),
      apiCallName: 'fetchGetProject',
    },
    persistUserOAuthTokens,
  );

const addWebhook = async (
  user,
  sourceCodeUrl,
  webhookEndpoint,
  persistUserOAuthTokens,
) => {
  const response = await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchAddWebhook(userOAuthAccessToken, sourceCodeUrl, webhookEndpoint),
      apiCallName: 'fetchAddWebhook',
    },
    persistUserOAuthTokens,
  );

  if (!response.ok) {
    throw await gitlabLogResponseError(user, response, 'Error creating webhook.');
  }

  return {
    ok: response.ok,
    status: response.status,
    data: await response.json(),
  };
};

const getWebhooks = async (user, sourceCodeUrl, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchWebhooks(userOAuthAccessToken, sourceCodeUrl),
      apiCallName: 'fetchWebhooks',
    },
    persistUserOAuthTokens,
  );

const deleteWebhooks = async (user, sourceCodeUrl, webhookId, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchDeleteWebhook(userOAuthAccessToken, sourceCodeUrl, webhookId),
      apiCallName: 'fetchDeleteWebhook',
    },
    persistUserOAuthTokens,
  );

const getUser = async (user, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) => fetchUser(userOAuthAccessToken),
      apiCallName: 'fetchUser',
    },
    persistUserOAuthTokens,
  );

const getProjectUser = async (
  user,
  sourceCodeUrl,
  gitlabUserId,
  persistUserOAuthTokens,
) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchProjectUser(userOAuthAccessToken, sourceCodeUrl, gitlabUserId),
      apiCallName: 'fetchProjectUser',
    },
    persistUserOAuthTokens,
  );

const getNamespace = async (user, namespace, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchGetNamespace(userOAuthAccessToken, namespace),
      apiCallName: 'fetchGetNamespace',
    },
    persistUserOAuthTokens,
  );

const sendCommitState = async (userOAuthAccessToken, sourceCodeUrl, options) =>
  await fetchPostCommitState(userOAuthAccessToken, sourceCodeUrl, options);

const createProject = async (
  user,
  namespaceId,
  projectName,
  importUrl,
  persistUserOAuthTokens,
) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchCreateProject(userOAuthAccessToken, namespaceId, projectName, importUrl),
      apiCallName: 'fetchCreateProject',
    },
    persistUserOAuthTokens,
  );

const refreshUserOAuthAccessTokens = async (user, persistUserOAuthTokens) => {
  logger.info(
    `GitLab: token will be refreshed for, 
         user ${gitlabLogUserInfo(user)}`,
  );
  const refreshResponse = await fetchRefreshUserOAuthTokens(user);
  if (!refreshResponse.ok) {
    throw await gitlabLogResponseError(
      user,
      refreshResponse,
      // eslint-disable-next-line max-len
      `error refreshing GitLab OAuth tokens for user ${gitlabLogUserInfo(user)}, try reconnecting your GitLab account manually.`,
    );
  }

  logger.info(
    `GitLab: token refreshed for, 
         user ${gitlabLogUserInfo(user)}`,
  );

  let refreshResponseData = await refreshResponse.json();
  const userOAuthTokens = {
    accessToken: refreshResponseData.access_token,
    refreshToken: refreshResponseData.refresh_token,
    expiresIn: refreshResponseData.expires_in,
    createdAt: refreshResponseData.created_at,
  };

  await persistUserOAuthTokens(user, userOAuthTokens);

  return userOAuthTokens;
};

const apiCallWithTokensRefresh = async (
  user,
  { apiCall, apiCallName },
  persistUserOAuthTokens,
) => {
  const errorMessage = `GitLab: Error calling API with tokens refresh 
                               for ${apiCallName} and user ${user.id}-${user.username}`;
  try {
    if (!user?.gitlabToken) {
      const error = new Error(`${errorMessage}, user does not have a GitLab token.`);
      gitlabLogError(error);
      throw error;
    }

    const response = await apiCall(user.gitlabToken);

    if (response.status === 401) {
      logger.info(
        `GitLab: unexpected token refresh required for api call ${apiCallName}(), 
         user id=${user.id} username=${user.username}`,
      );

      const userOAuthAccessTokens = await refreshUserOAuthAccessTokens(
        user,
        persistUserOAuthTokens,
      );

      logger.info(
        `Successful token refresh before api call ${apiCallName}(), 
         user ${user.id}-${user.username}`,
      );

      return await apiCall(userOAuthAccessTokens.accessToken);
    }

    return response;
  } catch (error) {
    gitlabLogError(error, errorMessage);
    throw error;
  }
};

module.exports = {
  OAUTH_PREFIX,
  getBaseUrl,
  normalizeUrl,
  getUrlEncodedPath,
  refreshUserOAuthAccessTokens,
  revokeUserOAuthTokens,
  getUser,
  createProject,
  getProject,
  getProjectUser,
  addWebhook,
  getWebhooks,
  deleteWebhooks,
  sendCommitState,
  getNamespace,
};
