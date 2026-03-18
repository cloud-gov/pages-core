const { logger } = require('../../winston');
const config = require('../../config');

const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded';
const CONTENT_TYPE_JSON = 'application/json';

const { authorizationOptions: gitlabConfig } = config.passport.gitlab;
const getBaseUrl = (gitlabConfigBaseURL) => gitlabConfigBaseURL?.replace(/\/$/, '');

const getHeaders = (user, contentType = CONTENT_TYPE_URL_ENCODED) => {
  return {
    'Content-Type': contentType,
    Authorization: `Bearer ${user.gitlabToken}`,
    Accept: 'application/json',
  };
};

const getClientCredentials = (_gitlabConfig) => {
  return {
    client_id: _gitlabConfig.clientID,
    client_secret: _gitlabConfig.clientSecret,
  };
};

function getUrlEncodedProjectPath(sourceCodeUrl) {
  const namespacedPath = sourceCodeUrl.replace(
    `${getBaseUrl(gitlabConfig.baseURL)}/`,
    '',
  );
  return encodeURIComponent(namespacedPath);
}

const fetchRefreshTokens = async (user) => {
  return fetch(`${getBaseUrl(gitlabConfig.baseURL)}/oauth/token`, {
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

const fetchAddWebhook = async (user, sourceCodeUrl, webhookEndpoint) => {
  return fetch(
    // eslint-disable-next-line max-len
    `${getBaseUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/hooks`,
    {
      method: 'POST',
      headers: getHeaders(user, CONTENT_TYPE_JSON),
      body: JSON.stringify({
        url: webhookEndpoint,
        push_events: true,
        branch_filter_strategy: 'all_branches',
      }),
    },
  );
};

const fetchWebhooks = async (user, sourceCodeUrl) => {
  return fetch(
    // eslint-disable-next-line max-len
    `${getBaseUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}/hooks`,
    {
      method: 'GET',
      headers: getHeaders(user),
    },
  );
};

const fetchGetProject = async (user, sourceCodeUrl) => {
  // eslint-disable-next-line max-len
  const url = `${getBaseUrl(gitlabConfig.baseURL)}/api/v4/projects/${getUrlEncodedProjectPath(sourceCodeUrl)}`;
  const headers = getHeaders(user);
  return fetch(url, {
    method: 'GET',
    headers: headers,
  });
};

const revokeToken = async (user, token, tokenType) => {
  if (!token) return;

  try {
    const revokeResponse = await fetch(
      `${getBaseUrl(gitlabConfig.baseURL)}/oauth/revoke`,
      {
        method: 'POST',
        headers: getHeaders(user),
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

const revokeUserGitLabTokens = async (user) => {
  try {
    await revokeToken(user, user.gitlabToken, 'access token');
    await revokeToken(user, user.gitlabRefreshToken, 'refresh token');

    const response = await fetchRefreshTokens(user);
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
};

const getProject = async (user, sourceCodeUrl, persistTokens) => {
  return await apiCallWithTokensRefresh(
    user,
    () => fetchGetProject(user, sourceCodeUrl),
    persistTokens,
  );
};

const addWebhook = async (user, sourceCodeUrl, webhookEndpoint, persistTokens) => {
  const response = await apiCallWithTokensRefresh(
    user,
    () => fetchAddWebhook(user, sourceCodeUrl, webhookEndpoint),
    persistTokens,
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

const getWebhooks = async (user, sourceCodeUrl, persistTokens) => {
  return apiCallWithTokensRefresh(
    user,
    () => fetchWebhooks(user, sourceCodeUrl),
    persistTokens,
  );
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

const apiCallWithTokensRefresh = async (user, apiCall, persistTokens) => {
  try {
    const projectResponse = await apiCall();

    if (projectResponse.status === 401) {
      const refreshResponse = await fetchRefreshTokens(user);
      if (!refreshResponse.ok) {
        persistTokens(user, {
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          createdAt: null,
        });
        throw await processError(
          refreshResponse,
          'Try reconnecting your GitLab account.',
        );
      }
      let refreshResponseData = await refreshResponse.json();
      persistTokens(user, {
        accessToken: refreshResponseData.access_token,
        refreshToken: refreshResponseData.refresh_token,
        expiresIn: refreshResponseData.expires_in,
        createdAt: refreshResponseData.created_at,
      });
      return await apiCall();
    }

    return projectResponse;
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
  fetchRefreshTokens,
  revokeUserGitLabTokens,
  getProject,
  addWebhook,
  getWebhooks,
};
