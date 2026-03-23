const GitLab = require('./GitLab');
const config = require('../../config');
const { updateGitLabTokens, resetGitLabTokens } = require('./user');

const getProject = async (user, sourceCodeUrl) => {
  return await GitLab.getProject(user, sourceCodeUrl, updateGitLabTokens);
};

const createSiteWebhook = async (user, site) => {
  const webhooks = await GitLab.getWebhooks(
    user,
    site.sourceCodeUrl,
    updateGitLabTokens,
  ).then((r) => r.json());

  if (webhooks.some((w) => w.url === config.webhook.gitlabEndpoint)) return null;

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

const getSiteBuildToken = async (user, _site) => {
  const userOAuthToken = await GitLab.getUserOAuthAccessToken(user, updateGitLabTokens);
  return `oauth2:${userOAuthToken}`;
};

const revokeUserGitLabTokens = async (user) =>
  await GitLab.revokeUserOAuthTokens(user, resetGitLabTokens);

const getGitLabBaseUrl = () => GitLab.getBaseUrl();

module.exports = {
  revokeUserGitLabTokens,
  getGitLabBaseUrl,
  getProject,
  createSiteWebhook,
  listSiteWebhooks,
  getSiteBuildToken,
};
