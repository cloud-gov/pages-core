const { logger } = require('../../winston');
const config = require('../../config');

const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded';
const CONTENT_TYPE_JSON = 'application/json';

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
const normalizeUrl = (gitlabConfigBaseURL) => gitlabConfigBaseURL?.replace(/\/$/, '');
const getBaseUrl = () => normalizeUrl(gitlabConfig.baseURL);

const getHeaders = ({ user, contentType }) => ({
  Authorization: `Bearer ${user.gitlabToken}`,
  Accept: 'application/json',
  ...(contentType && { 'Content-Type': contentType }),
});

const getClientCredentials = (_gitlabConfig) => {
  return {
    client_id: _gitlabConfig.clientID,
    client_secret: _gitlabConfig.clientSecret,
  };
};

function getUrlEncodedProjectPath(sourceCodeUrl) {
  const namespacedPath = sourceCodeUrl.replace(
    `${normalizeUrl(gitlabConfig.baseURL)}/`,
    '',
  );
  return encodeURIComponent(namespacedPath);
}

const fetchRefreshUserOAuthTokens = async (user) => {
  return fetch(`${normalizeUrl(gitlabConfig.baseURL)}/oauth/token`, {
    method: 'POST',
    headers: getHeaders({ user, contentType: CONTENT_TYPE_URL_ENCODED }),
    body: new URLSearchParams({
      ...getClientCredentials(gitlabConfig),
      refresh_token: user.gitlabRefreshToken,
      grant_type: 'refresh_token',
      redirect_uri: gitlabConfig.callbackURL,
    }),
  });
};

const fetchAddWebhook = async (user, sourceCodeUrl, webhookEndpoint) => {
  return fetch(
    // eslint-disable-next-line max-len
    `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/hooks`,
    {
      method: 'POST',
      headers: getHeaders({ user, contentType: CONTENT_TYPE_JSON }),
      body: JSON.stringify({
        url: webhookEndpoint,
        push_events: true,
        branch_filter_strategy: 'all_branches',
        token: config.webhook.gitlabSecret,
      }),
    },
  );
};

const fetchWebhooks = async (user, sourceCodeUrl) => {
  return fetch(
    // eslint-disable-next-line max-len
    `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/hooks`,
    {
      method: 'GET',
      headers: getHeaders({ user }),
    },
  );
};

const fetchGetProject = async (user, sourceCodeUrl) => {
  // eslint-disable-next-line max-len
  const url = `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}`;
  const headers = getHeaders({ user });
  return fetch(url, {
    method: 'GET',
    headers: headers,
  });
};

const fetchProjectUser = async (user, sourceCodeUrl, userId) => {
  // eslint-disable-next-line max-len
  const url = `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/members/all/${userId}`;
  const headers = getHeaders({ user });
  return fetch(url, {
    method: 'GET',
    headers: headers,
  });
};

const fetchUser = async (user) => {
  const url = `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/user`;
  const headers = getHeaders({ user });
  return fetch(url, {
    method: 'GET',
    headers: headers,
  });
};

const fetchPostCommitStatus = async (gitlabToken, sourceCodeUrl, options) => {
  // eslint-disable-next-line max-len
  const url = `${normalizeUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/statuses/${options.sha}?state=${options.state}`;
  const headers = getHeaders({
    user: { gitlabToken },
    contentType: CONTENT_TYPE_URL_ENCODED,
  });

  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams({
      state: options.state, // running, success, failed, canceled, skipped
      target_url: options.target_url,
      description: options.description,
      name: `${config.app.product}-${config.app.appEnv}`,
    }),
  });
};

const revokeToken = async (user, token, tokenType) => {
  if (!token) return;

  try {
    const revokeResponse = await fetch(
      `${normalizeUrl(gitlabConfig.baseURL)}/oauth/revoke`,
      {
        method: 'POST',
        headers: getHeaders({ user, contentType: CONTENT_TYPE_URL_ENCODED }),
        body: new URLSearchParams({
          ...getClientCredentials(gitlabConfig),
          token: `${token}`,
        }),
      },
    );

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

const getProject = async (user, sourceCodeUrl, persistUserOAuthTokens) => {
  return await apiCallWithTokensRefresh(
    user,
    () => fetchGetProject(user, sourceCodeUrl),
    persistUserOAuthTokens,
  );
};

const addWebhook = async (
  user,
  sourceCodeUrl,
  webhookEndpoint,
  persistUserOAuthTokens,
) => {
  const response = await apiCallWithTokensRefresh(
    user,
    () => fetchAddWebhook(user, sourceCodeUrl, webhookEndpoint),
    persistUserOAuthTokens,
  );

  if (!response.ok) {
    throw await processError(response, 'Error creating webhook.');
  }

  return {
    ok: response.ok,
    status: response.status,
    data: await response.json(),
  };
};

const getWebhooks = async (user, sourceCodeUrl, persistUserOAuthTokens) => {
  return await apiCallWithTokensRefresh(
    user,
    () => fetchWebhooks(user, sourceCodeUrl),
    persistUserOAuthTokens,
  );
};

const getUser = async (user, persistUserOAuthTokens) => {
  return await apiCallWithTokensRefresh(
    user,
    () => fetchUser(user),
    persistUserOAuthTokens,
  );
};

const getProjectUser = async (user, sourceCodeUrl, userId, persistUserOAuthTokens) => {
  return await apiCallWithTokensRefresh(
    user,
    () => fetchProjectUser(user, sourceCodeUrl, userId),
    persistUserOAuthTokens,
  );
};

const sendCommitStatus = async (accessToken, sourceCodeUrl, options) => {
  return await fetchPostCommitStatus(accessToken, sourceCodeUrl, options);
};

const getUserOAuthAccessToken = async (user, persistUserOAuthTokens) => {
  const userOAuthAccessTokens = await refreshUserOAuthTokens(
    user,
    persistUserOAuthTokens,
  );
  return userOAuthAccessTokens.accessToken;
};

const processError = async (response, message) => {
  const data = await response.json();
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
    await persistUserOAuthTokens(user, {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      createdAt: null,
    });
    throw await processError(refreshResponse, 'Try reconnecting your GitLab account.');
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

const apiCallWithTokensRefresh = async (user, apiCall, persistUserOAuthTokens) => {
  try {
    const response = await apiCall();

    if (response.status === 401) {
      await refreshUserOAuthTokens(user, persistUserOAuthTokens);
      return await apiCall();
    }

    return response;
  } catch (error) {
    logger.error(
      'GitLab: Error calling API with tokens refresh.',
      error.message,
      error.stack,
    );
    throw error;
  }
};

module.exports = {
  getBaseUrl,
  normalizeUrl,
  fetchRefreshUserOAuthTokens,
  revokeUserOAuthTokens,
  getUser,
  getProject,
  getProjectUser,
  addWebhook,
  getWebhooks,
  getUserOAuthAccessToken,
  sendCommitStatus,
};
