const { Site } = require('../models');
const GithubBuildHelper = require('./GithubBuildHelper');
const GitLabHelper = require('./GitLabHelper');
const GitHub = require('./GitHub');
const { domain } = require('../utils/build');
const GitLab = require('./GitLab');
const config = require('../../config');
const url = require('url');
const { logger } = require('../../winston');

const isWorkshop = (sourceCodePlatform) => sourceCodePlatform === Site.Platforms.Workshop;

const reportBuildStatus = async (build) => {
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (!sha) {
    throw new Error('Build or commit sha undefined. Unable to report build status');
  }

  const context =
    config.app.appEnv === 'production'
      ? `${config.app.product}/build`
      : `${config.app.product}-${config.app.appEnv}/build`;

  const site = build.Site;

  const options = {
    owner: site.owner,
    repo: site.repository,
    sha,
    context,
  };

  if (build.isInProgress()) {
    options.state = 'pending';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description =
      'The build is running. Click "Details" to see the Pages build status.';
  } else if (build.state === 'success') {
    options.state = 'success';
    options.target_url = build.url;
    options.description =
      'The build is complete! Click "Details" to visit the Site Preview.';
  } else if (build.state === 'error' || build.state === 'invalid') {
    options.state = isWorkshop(build) ? 'failed' : 'error';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description =
      'The build has encountered an error. Click "Details" to see the Pages build logs.';
  }

  if (isWorkshop(build)) {
    return await GitLabHelper.sendCommitStatus(build.user, site, options);
  } else {
    const accessToken = await GithubBuildHelper.loadBuildUserAccessToken(build);
    return GitHub.sendCreateGithubStatusRequest(accessToken, options);
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
    ? await checkGitlabRepository(user, site.sourceCodeUrl)
    : await GitHub.checkPermissions(user, site.owner, site.repository);

const getProcessedGitLabWebhookPayload = (payload) =>
  GitLab.getProcessedWebhookPayload(payload);

const checkGitlabRepository = async (user, sourceCodeUrl) => {
  return GitLabHelper.getProject(user, sourceCodeUrl).then(async (response) => {
    if (!response.ok) {
      logger.error(await response.json());
      throw {
        message: `The repository ${sourceCodeUrl} does not exist.`,
        status: response.status,
      };
    }
    return await response.json();
  });
};

module.exports = {
  checkPermissions,
  createSiteWebhook,
  setWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  getSourceCodePlatformDomain,
  getSourceCodePlatformToken,
  getProcessedGitLabWebhookPayload,
  checkGitlabRepository,
};
