const GitLab = require('./GitLab');
const config = require('../../config');
const { updateGitLabTokens } = require('./user');

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
  return await GitLab.getWebhooks(user, site.sourceCodeUrl, updateGitLabTokens).then(
    (r) => r.json(),
  );
};

module.exports = {
  createSiteWebhook,
  listSiteWebhooks,
};
