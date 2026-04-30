const { logger } = require('../../winston');
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

const fetchRefreshUserOAuthTokens = async (user) => {
  const response = fetch(`${getNormalizedBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: getHeaders(user.gitlabToken, CONTENT_TYPE_URL_ENCODED),
    body: new URLSearchParams({
      ...getClientCredentials(gitlabConfig),
      refresh_token: user.gitlabRefreshToken,
      grant_type: 'refresh_token',
      redirect_uri: gitlabConfig.callbackURL,
    }),
  });

  logger.error(
    // eslint-disable-next-line max-len
    `GitLab fetchRefreshUserOAuthTokens() - ${response.ok} - ${response.status}:\n${new Error().stack}`,
  );

  return response;
};

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

const fetchPostCommitStatus = async (userOAuthAccessToken, sourceCodeUrl, options) =>
  fetch(
    getApiUrl(
      // eslint-disable-next-line max-len
      `projects/${getUrlEncodedPath(sourceCodeUrl)}/statuses/${options.sha}?state=${options.state}`,
    ),
    {
      method: 'POST',
      headers: getHeaders(userOAuthAccessToken, CONTENT_TYPE_URL_ENCODED),
      body: new URLSearchParams({
        state: options.state, // running, success, failed, canceled, skipped
        target_url: options.target_url,
        description: options.description,
        name: `${config.app.product}-${config.app.appEnv}`,
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
    throw await processError(user, response, 'Error creating webhook.');
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

const getProjectUser = async (user, sourceCodeUrl, userId, persistUserOAuthTokens) =>
  await apiCallWithTokensRefresh(
    user,
    {
      apiCall: (userOAuthAccessToken) =>
        fetchProjectUser(userOAuthAccessToken, sourceCodeUrl, userId),
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

const sendCommitStatus = async (userOAuthAccessToken, sourceCodeUrl, options) =>
  await fetchPostCommitStatus(userOAuthAccessToken, sourceCodeUrl, options);

const getRefreshedUserOAuthAccessToken = async (user, persistUserOAuthTokens) =>
  (await refreshUserOAuthTokens(user, persistUserOAuthTokens)).accessToken;

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
    true,
  );

const processError = async (user, response, message) => {
  const data = await response.json();
  logger.error(
    // eslint-disable-next-line max-len
    `Error: userName: ${user?.id} - ${user?.userName}, response: ${response.status} - ${JSON.stringify(data)}`,
  );
  logger.error(`GitLab processError:\n${new Error().stack}`);
  return Object.assign(
    new Error(
      [data.error, data.error_description, data.message, message]
        .filter(Boolean)
        .map((s) => (s.endsWith('.') ? s : `${s}.`))
        .join(' '),
    ),
    {
      response: data,
      status: response.status,
    },
  );
};

const refreshUserOAuthTokens = async (user, persistUserOAuthTokens) => {
  const refreshResponse = await fetchRefreshUserOAuthTokens(user);
  if (!refreshResponse.ok) {
    throw await processError(
      user,
      refreshResponse,
      'Error refreshing user GitLab OAuth tokens. Try reconnecting your GitLab account.',
    );
  }

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
  refreshUserOAuthTokensFirst = false,
) => {
  const errorMessage = `GitLab: Error calling API with tokens refresh for ${apiCallName}`;
  try {
    if (!user.gitlabToken) {
      const error = `${errorMessage}, user does not have a GitLab token.`;
      logger.error(error);
      throw new Error(error);
    }

    if (refreshUserOAuthTokensFirst) {
      const userOAuthAccessTokens = await refreshUserOAuthTokens(
        user,
        persistUserOAuthTokens,
      );

      return await apiCall(userOAuthAccessTokens.accessToken);
    } else {
      const response = await apiCall(user.gitlabToken);

      if (response.status === 401) {
        const userOAuthAccessTokens = await refreshUserOAuthTokens(
          user,
          persistUserOAuthTokens,
        );
        return await apiCall(userOAuthAccessTokens.accessToken);
      }

      return response;
    }
  } catch (error) {
    logger.error(errorMessage, error.message, error.stack);
    throw error;
  }
};

module.exports = {
  OAUTH_PREFIX,
  getBaseUrl,
  normalizeUrl,
  fetchRefreshUserOAuthTokens,
  getUserOAuthAccessToken: getRefreshedUserOAuthAccessToken,
  revokeUserOAuthTokens,
  getUser,
  createProject,
  getProject,
  getProjectUser,
  addWebhook,
  getWebhooks,
  deleteWebhooks,
  sendCommitStatus,
  getNamespace,
};
