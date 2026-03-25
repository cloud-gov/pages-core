const { Site } = require('../models');
const GithubBuildHelper = require('./GithubBuildHelper');
const GitLabHelper = require('./GitLabHelper');
const GitHub = require('./GitHub');
const { domain } = require('../utils/build');
const GitLab = require('./GitLab');
const config = require('../../config');

const isWorkshop = (sourceCodePlatform) => sourceCodePlatform === Site.Platforms.Workshop;

const reportBuildStatus = async (build) => {
  if (isWorkshop(build.Site.sourceCodePlatform)) {
    await GitLabHelper.reportBuildStatus(build);
  } else {
    await GithubBuildHelper.reportBuildStatus(build);
  }
};

const createSiteWebhook = async (user, site, users) =>
  isWorkshop(site.sourceCodePlatform)
    ? await GitLabHelper.createSiteWebhook(user, site)
    : await GithubBuildHelper.createSiteWebhook(site, users);

const setWebhook = async (user, site) =>
  isWorkshop(site.sourceCodePlatform)
    ? await GitLabHelper.createSiteWebhook(user, site)
    : await GitHub.setWebhook(site, user.githubAccessToken);

const listSiteWebhooks = async (user, site, users) =>
  isWorkshop(site.sourceCodePlatform)
    ? await GitLabHelper.listSiteWebhooks(user, site)
    : await GithubBuildHelper.listSiteWebhooks(site, users);

const getSourceCodePlatformDomain = (sourceCodePlatform) =>
  isWorkshop(sourceCodePlatform)
    ? domain(GitLab.getBaseUrl())
    : domain(config.app.githubBaseUrl);

const getSourceCodePlatformToken = async (build) =>
  isWorkshop(build.Site.sourceCodePlatform)
    ? await GitLabHelper.getSiteBuildToken(build.User)
    : (build.User?.githubAccessToken ??
      (await GithubBuildHelper.loadBuildUserAccessToken(build)));

const checkPermissions = async (user, site) =>
  isWorkshop(site.sourceCodePlatform)
    ? { admin: {} } // TODO: Workshop Integration
    : await GitHub.checkPermissions(user, site.owner, site.repository);

const getProcessedGitLabWebhookPayload = (payload) =>
  GitLab.processWebhookPayload(payload);

module.exports = {
  checkPermissions,
  createSiteWebhook,
  setWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  getSourceCodePlatformDomain,
  getSourceCodePlatformToken,
  getProcessedGitLabWebhookPayload,
};
