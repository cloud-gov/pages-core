const GitLab = require('./GitLab');
const config = require('../../config');
const { updateGitLabTokens, resetGitLabTokens } = require('./user');
const { logger } = require('../../winston');
const { gitlabLogError, gitlabLogUserInfo } = require('../utils/gitlabLogger');

const GITLAB_ACCESS_LEVEL_GUEST = 10;
const GITLAB_ACCESS_LEVEL_REPORTER = 20;
const GITLAB_ACCESS_LEVEL_DEVELOPER = 30;
const GITLAB_ACCESS_LEVEL_MAINTAINER = 40;
const GITLAB_ACCESS_LEVEL_OWNER = 50;

const PAGES_ACCESS_LEVELS_CREATE_SITE = [
  GITLAB_ACCESS_LEVEL_MAINTAINER,
  GITLAB_ACCESS_LEVEL_OWNER,
];
const PAGES_ACCESS_LEVELS_DESTROY_SITE = [GITLAB_ACCESS_LEVEL_OWNER];

const PULL = [
  GITLAB_ACCESS_LEVEL_REPORTER,
  GITLAB_ACCESS_LEVEL_DEVELOPER,
  GITLAB_ACCESS_LEVEL_MAINTAINER,
  GITLAB_ACCESS_LEVEL_OWNER,
];

const PUSH = [
  GITLAB_ACCESS_LEVEL_DEVELOPER,
  GITLAB_ACCESS_LEVEL_MAINTAINER,
  GITLAB_ACCESS_LEVEL_OWNER,
];

const ADMIN = [GITLAB_ACCESS_LEVEL_MAINTAINER, GITLAB_ACCESS_LEVEL_OWNER];

const GITLAB_COMMIT_STATE_RUNNING = 'running';
const GITLAB_COMMIT_STATE_SUCCESS = 'success';
const GITLAB_COMMIT_STATE_FAILED = 'failed';

// 1hr before GitLab access token expiration, TTL is 2 hrs
const TOKEN_PROACTIVE_REFRESH_MS = 60 * 60 * 1000;

const createSiteWebhook = async (user, site) => {
  const webhooksResponse = await GitLab.getWebhooks(
    user,
    site.sourceCodeUrl,
    updateGitLabTokens,
  );

  if (webhooksResponse.ok) {
    const webhooks = await webhooksResponse.json();
    if (webhooks.some((w) => w.url === config.webhook.gitlabEndpoint)) return null;
  }

  return GitLab.addWebhook(
    user,
    site.sourceCodeUrl,
    config.webhook.gitlabEndpoint,
    updateGitLabTokens,
  );
};

const listSiteWebhooks = async (user, site) => {
  const response = await GitLab.getWebhooks(user, site.sourceCodeUrl, updateGitLabTokens);
  return await response.json();
};

const revokeUserGitLabTokens = async (user) =>
  await GitLab.revokeUserOAuthTokens(user, resetGitLabTokens);

const getGitLabBaseUrl = () => GitLab.getBaseUrl();

const isRepostingTheSameState = (response, responseData) => {
  return (
    response.status == 400 &&
    responseData.message.startsWith('Cannot transition status via')
  );
};

const sendCommitState = async (user, site, options) => {
  logger.info(
    // eslint-disable-next-line max-len
    `GitLab: posting commit status "${options.state}" for context "${options.context} by user ${gitlabLogUserInfo(user)}"`,
  );
  const response = await GitLab.sendCommitState(
    user?.gitlabToken,
    site.sourceCodeUrl,
    options,
  );

  if (!response.ok) {
    const responseData = await response.json();

    if (isRepostingTheSameState(response, responseData)) {
      logger.info(
        // eslint-disable-next-line max-len
        `GitLab: reposting the same commit state "${options.state}" by user ${gitlabLogUserInfo(user)} - ${response.status} - ${JSON.stringify(responseData)}`,
      );
    } else {
      throw new Error(
        // eslint-disable-next-line max-len
        `Failed to send commit state "${options.state}" by ${gitlabLogUserInfo(user)} - ${response.status} - ${JSON.stringify(responseData)}`,
      );
    }
  }

  return response;
};

const mapWebhookRequestToGitHubFormat = (payload) => {
  if (!payload || !payload.project?.web_url) return {};

  const [, owner, ...rest] = payload.project.web_url
    .replace(`${getGitLabBaseUrl()}`, '')
    .split('/');
  return {
    after: payload.after,
    commits: payload.commits && payload.commits.length > 0 ? [{}] : undefined,
    owner,
    repository: {
      repository_path: rest.join('/'),
      pushed_at: Math.floor(new Date(payload.commits[0]?.timestamp).getTime() / 1000),
    },
    sender: { login: payload.user_username, gitlabUserId: `${payload.user_id}` },
    ref: payload.ref,
  };
};

async function getUserProjectForDeletion(user, sourceCodeUrl) {
  const userResponse = await GitLab.getUser(user, updateGitLabTokens);
  if (!userResponse.ok) return { userResponseOk: userResponse.ok };

  const userResponseData = await userResponse.json();
  logger.info(
    `GitLab: getUser() for user ${gitlabLogUserInfo(user)} - ${userResponseData.data}`,
  );
  const projectUserResponse = await GitLab.getProjectUser(
    user,
    sourceCodeUrl,
    userResponseData.id,
    updateGitLabTokens,
  );

  return {
    userResponseOk: userResponse.ok,
    projectUserResponseOk: projectUserResponse.ok,
    projectUserResponseStatus: projectUserResponse.status,
    canCreateProject: userResponseData.can_create_project,
    accessLevel: (await projectUserResponse.json()).access_level,
  };
}

const mapGitLabAccessLevelToGitHubPermissions = (accessLevel) => ({
  pull: PULL.includes(accessLevel),
  push: PUSH.includes(accessLevel),
  admin: ADMIN.includes(accessLevel),
});

async function getProjectAccessLevel(user, sourceCodeUrl) {
  if (!user.gitlabUserId) {
    const userResponse = await GitLab.getUser(user, updateGitLabTokens);
    if (userResponse.ok) {
      const { id } = await userResponse.json();
      await user.update({
        gitlabUserId: `${id}`,
      });
    }
  }

  const projectUserResponse = await GitLab.getProjectUser(
    user,
    sourceCodeUrl,
    user.gitlabUserId,
    updateGitLabTokens,
  );

  if (!projectUserResponse.ok) {
    logger.error(
      // eslint-disable-next-line max-len
      `GitLab: silent error from getProjectUser() for user id:${user.id}, username:${user.username}, gitlabUserId:${user.gitlabUserId} response: ${projectUserResponse.status} - ${JSON.stringify(await projectUserResponse.json())}`,
    );
    return null;
  } else {
    return (await projectUserResponse.json()).access_level;
  }
}

const getProjectPermissions = async (user, sourceCodeUrl) =>
  mapGitLabAccessLevelToGitHubPermissions(
    await getProjectAccessLevel(user, sourceCodeUrl),
  );

const checkProjectAccessLevel = async (user, sourceCodeUrl, accessLevels) => {
  if (!accessLevels.includes(await getProjectAccessLevel(user, sourceCodeUrl))) {
    throw {
      message: 'You do not have required access level.',
      status: 403,
    };
  }
};

const getGitLabProjectForPermissions = async (user, sourceCodeUrl, accessLevels) => {
  await checkProjectAccessLevel(user, sourceCodeUrl, accessLevels);

  const projectResponse = await GitLab.getProject(
    user,
    sourceCodeUrl,
    updateGitLabTokens,
  );
  return await projectResponse.json();
};

const getGitLabProjectToCreateSite = async (user, sourceCodeUrl) =>
  await getGitLabProjectForPermissions(
    user,
    sourceCodeUrl,
    PAGES_ACCESS_LEVELS_CREATE_SITE,
  );

const createProjectFromTemplate = async (user, namespace, projectName, templateUrl) => {
  const namespaceResponse = await GitLab.getNamespace(
    user,
    namespace,
    updateGitLabTokens,
  );
  const { id: namespaceId } = await namespaceResponse.json();

  if (!namespaceResponse.ok || !namespaceId) {
    const message = `Cannot create project for namespace ${namespace}`;
    const error = new Error(message);
    error.status = 400;
    error.message = message;
    throw error;
  }

  const projectResponse = await GitLab.createProject(
    user,
    namespaceId,
    projectName,
    templateUrl,
    updateGitLabTokens,
  );

  if (!projectResponse.ok) {
    const responseData = await projectResponse.json();
    const message = `Cannot create project from template ${templateUrl} 
      - ${projectResponse.status}
      - ${JSON.stringify(responseData)}`;
    const error = new Error(message);
    error.status = projectResponse.status;
    error.message = message;
    throw error;
  }

  return projectResponse;
};

const deleteWebhook = async (user, site) => {
  if (!site.webhookId) return null;

  try {
    await checkProjectAccessLevel(
      user,
      site.sourceCodeUrl,
      PAGES_ACCESS_LEVELS_DESTROY_SITE,
    );
    const webhooksResponse = await GitLab.deleteWebhooks(
      user,
      site.sourceCodeUrl,
      site.webhookId,
      updateGitLabTokens,
    );
    if (!webhooksResponse?.ok) {
      logger.error(
        // eslint-disable-next-line max-len
        `GitLab: Error deleting webhook ${site.webhookId} for ${site.sourceCodeUrl} - response: ${webhooksResponse.status} - ${await JSON.stringify(webhooksResponse.json())}.`,
      );
    }
  } catch (error) {
    logger.error(
      `GitLab: Error deleting webhook ${site.webhookId} for ${site.sourceCodeUrl}.`,
      error.message,
      error.stack,
    );
  }
};

const refreshUserGitLabTokenIfNeeded = async (user, now, flowDescription) => {
  try {
    if (!user || !user?.gitlabToken) {
      logger.info(
        // eslint-disable-next-line max-len
        `GitLab: user does not have a token to refresh, user ${gitlabLogUserInfo(user)} in flow ${flowDescription}`,
      );
      return;
    }

    const isRefreshRequired =
      user?.gitlabExpiresAt?.getTime() < now + TOKEN_PROACTIVE_REFRESH_MS;
    logger.info(
      // eslint-disable-next-line max-len
      `GitLab: for user ${gitlabLogUserInfo(user)} in flow ${flowDescription} token refresh ${isRefreshRequired ? 'is required.' : 'is not required.'}`,
    );
    if (isRefreshRequired) {
      await GitLab.refreshUserOAuthAccessTokens(user, updateGitLabTokens);
    }
  } catch (error) {
    gitlabLogError(
      error,
      // eslint-disable-next-line max-len
      `GitLab: Silent error refreshing token for user ${user.id}-${user.name} and expiration ${user.gitlabExpiresAt} in flow ${flowDescription}`,
    );
  }
};

module.exports = {
  GITLAB_ACCESS_LEVEL_GUEST,
  GITLAB_ACCESS_LEVEL_REPORTER,
  GITLAB_ACCESS_LEVEL_DEVELOPER,
  GITLAB_ACCESS_LEVEL_MAINTAINER,
  GITLAB_ACCESS_LEVEL_OWNER,
  PAGES_ACCESS_LEVELS_DESTROY_SITE,
  OAUTH_PREFIX: GitLab.OAUTH_PREFIX,
  GITLAB_COMMIT_STATE_RUNNING,
  GITLAB_COMMIT_STATE_SUCCESS,
  GITLAB_COMMIT_STATE_FAILED,
  TOKEN_PROACTIVE_REFRESH_MS,
  revokeUserGitLabTokens,
  getGitLabBaseUrl,
  getGitLabProjectToCreateSite,
  createSiteWebhook,
  listSiteWebhooks,
  sendCommitState,
  mapWebhookRequestToGitHubFormat,
  getUserProjectForDeletion,
  createProjectFromTemplate,
  deleteWebhook,
  getProjectAccessLevel,
  getProjectPermissions,
  refreshUserGitLabTokenIfNeeded,
};
