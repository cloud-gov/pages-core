const GitLab = require('./GitLab');
const config = require('../../config');
const { updateGitLabTokens, resetGitLabTokens } = require('./user');
const { logger } = require('../../winston');

const GITLAB_ACCESS_LEVEL_GUEST = 10;
const GITLAB_ACCESS_LEVEL_REPORTER = 20;
const GITLAB_ACCESS_LEVEL_DEVELOPER = 30;
const GITLAB_ACCESS_LEVEL_MAINTAINER = 40;
const GITLAB_ACCESS_LEVEL_OWNER = 50;

const PAGES_ACCESS_LEVELS_CREATE_SITE = [
  GITLAB_ACCESS_LEVEL_OWNER,
  GITLAB_ACCESS_LEVEL_MAINTAINER,
];
const PAGES_ACCESS_LEVELS_DESTROY_SITE = [GITLAB_ACCESS_LEVEL_OWNER];

const getProject = async (user, sourceCodeUrl) => {
  return await GitLab.getProject(user, sourceCodeUrl, updateGitLabTokens);
};

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

const getUserOAuthAccessToken = async (user) =>
  await GitLab.getUserOAuthAccessToken(user, updateGitLabTokens);

const revokeUserGitLabTokens = async (user) =>
  await GitLab.revokeUserOAuthTokens(user, resetGitLabTokens);

const getGitLabBaseUrl = () => GitLab.getBaseUrl();

const sendCommitStatus = async (accessToken, site, options) => {
  const response = await GitLab.sendCommitStatus(
    accessToken,
    site.sourceCodeUrl,
    options,
  );

  if (!response.ok) {
    logger.error(await response.json());
    throw new Error(
      `Failed to send commit status (${options.state}): ${response.status}`,
    );
  }

  return response;
};

const getProcessedWebhookPayload = (payload) => {
  const [, owner, ...rest] = payload.project.web_url
    .replace(`${getGitLabBaseUrl()}`, '')
    .split('/');
  const repositoryPath = rest.join('/');
  const processedPayload = {
    after: payload.after,
    commits: payload.commits && payload.commits.length > 0 ? [{}] : undefined,
    owner,
    repository: {
      repository_path: repositoryPath,
      pushed_at: Math.floor(new Date(payload.commits[0]?.timestamp).getTime() / 1000),
    },
    sender: { login: payload.user_username },
    ref: payload.ref,
  };

  return processedPayload;
};

async function getProjectAccessLevel(user, sourceCodeUrl) {
  const userResponse = await GitLab.getUser(user, updateGitLabTokens);
  const { id: userId } = await userResponse.json();

  const projectUserResponse = await GitLab.getProjectUser(
    user,
    sourceCodeUrl,
    userId,
    updateGitLabTokens,
  );
  const { access_level: accessLevel } = await projectUserResponse.json();
  return accessLevel;
}

const getGitLabProjectForPermissions = async (user, sourceCodeUrl, accessLevels) => {
  const accessLevel = await getProjectAccessLevel(user, sourceCodeUrl);

  if (!accessLevels.includes(accessLevel)) {
    throw {
      message: 'You do not have required access level',
      status: 403,
    };
  }

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

const getGitLabProjectToDestroySite = async (user, sourceCodeUrl) =>
  await getGitLabProjectForPermissions(
    user,
    sourceCodeUrl,
    PAGES_ACCESS_LEVELS_DESTROY_SITE,
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

module.exports = {
  GITLAB_ACCESS_LEVEL_GUEST,
  GITLAB_ACCESS_LEVEL_REPORTER,
  GITLAB_ACCESS_LEVEL_DEVELOPER,
  GITLAB_ACCESS_LEVEL_MAINTAINER,
  GITLAB_ACCESS_LEVEL_OWNER,
  OAUTH_PREFIX: GitLab.OAUTH_PREFIX,
  revokeUserGitLabTokens,
  getGitLabBaseUrl,
  getProject,
  getGitLabProjectToCreateSite,
  getGitLabProjectToDestroySite,
  createSiteWebhook,
  listSiteWebhooks,
  getUserOAuthAccessToken,
  sendCommitStatus,
  getProcessedWebhookPayload,
  getProjectAccessLevel,
  createProjectFromTemplate,
};
