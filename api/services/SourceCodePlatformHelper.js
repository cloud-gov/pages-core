const { Site } = require('../models');
const GithubBuildHelper = require('./GithubBuildHelper');
const GitLabHelper = require('./GitLabHelper');
const GitHub = require('./GitHub');
const { domain } = require('../utils/build');
const config = require('../../config');
const url = require('url');
const Organization = require('./organization');

const PULL = [
  GitLabHelper.GITLAB_ACCESS_LEVEL_REPORTER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_DEVELOPER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_MAINTAINER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER,
];

const PUSH = [
  GitLabHelper.GITLAB_ACCESS_LEVEL_DEVELOPER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_MAINTAINER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER,
];

const ADMIN = [
  GitLabHelper.GITLAB_ACCESS_LEVEL_MAINTAINER,
  GitLabHelper.GITLAB_ACCESS_LEVEL_OWNER,
];

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

  const workshop = isWorkshop(site.sourceCodePlatform);

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
    options.state = workshop ? 'failed' : 'error';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description =
      'The build has encountered an error. Click "Details" to see the Pages build logs.';
  }

  const accessToken = await loadBuildUserAccessToken(build);

  return workshop
    ? await GitLabHelper.sendCommitStatus(accessToken, site, options)
    : await GitHub.sendCreateGithubStatusRequest(accessToken, options);
};

const createSiteWebhook = async (user, site) => {
  if (isWorkshop(site.sourceCodePlatform)) {
    return await GitLabHelper.createSiteWebhook(user, site);
  } else {
    const users = await Organization.getOrganizationUsers(site);
    return await GithubBuildHelper.createSiteWebhook(
      site,
      users,
      getAccessTokenWithAdminPermissions,
    );
  }
};

const listSiteWebhooks = async (user, site, users) =>
  isWorkshop(site.sourceCodePlatform)
    ? await GitLabHelper.listSiteWebhooks(user, site)
    : await GithubBuildHelper.listSiteWebhooks(
        site,
        users,
        getAccessTokenWithAdminPermissions,
      );

const getSourceCodePlatformDomain = (sourceCodePlatform) =>
  isWorkshop(sourceCodePlatform)
    ? domain(GitLabHelper.getGitLabBaseUrl())
    : domain(config.app.githubBaseUrl);

const getTokenForSiteBuild = async (build) => {
  const workshop = isWorkshop(build.Site?.sourceCodePlatform);
  let token = workshop
    ? build.User && (await GitLabHelper.getUserOAuthAccessToken(build.User))
    : build.User?.githubAccessToken;
  if (!token) token = await loadBuildUserAccessToken(build);

  return workshop ? `oauth2:${token}` : token;
};

const getProcessedGitLabWebhookPayload = (payload) =>
  GitLabHelper.getProcessedWebhookPayload(payload);

const getGitLabProjectToCreateSite = async (user, sourceCodeUrl) =>
  await GitLabHelper.getGitLabProjectToCreateSite(user, sourceCodeUrl);

const getUsersWithToken = (users, sourceCodePlatform) =>
  isWorkshop(sourceCodePlatform)
    ? getUsersWithGitLabToken(users)
    : getUsersWithGitHubToken(users);

const getUsersWithGitHubToken = (users) =>
  users
    .filter((u) => u.githubAccessToken && u.signedInAt)
    .sort((a, b) => b.signedInAt - a.signedInAt);

const getUsersWithGitLabToken = (users) =>
  users
    .filter((u) => u.gitlabToken)
    .sort((a, b) => b.gitlabExpiresAt - a.gitlabExpiresAt);

const mapGitLabAccessLevelToGitHubPermissions = (accessLevel) => ({
  pull: PULL.includes(accessLevel),
  push: PUSH.includes(accessLevel),
  admin: ADMIN.includes(accessLevel),
});

const getPermissions = async (user, site, sourceCodeUrl) =>
  isWorkshop(sourceCodeUrl)
    ? mapGitLabAccessLevelToGitHubPermissions(
        await GitLabHelper.getProjectAccessLevel(user, site.sourceCodeUrl),
      )
    : await GitHub.checkPermissions(user, site.owner, site.repository);

const getToken = (user, sourceCodeUrl) =>
  isWorkshop(sourceCodeUrl) ? user.gitlabToken : user.githubAccessToken;

// Loops through supplied list of users, until it
// finds a user with a valid access token
const getAccessTokenWithCertainPermissions = async (
  site,
  users,
  permission,
  sourceCodePlatform,
) => {
  let count = 0;

  if (!users) {
    return null;
  }

  const filteredUsers = getUsersWithToken(users, sourceCodePlatform);

  const getNextToken = async (user) => {
    try {
      if (!user) {
        return null;
      }
      const permissions = await getPermissions(user, site, sourceCodePlatform);

      if (permissions[permission]) {
        return getToken(user, sourceCodePlatform);
      }
      count += 1;
      return getNextToken(filteredUsers[count]);
    } catch {
      count += 1;
      return getNextToken(filteredUsers[count]);
    }
  };

  return getNextToken(filteredUsers[count]);
};

const getAccessTokenWithPushPermissions = async (site, users, sourceCodePlatform) =>
  getAccessTokenWithCertainPermissions(site, users, 'push', sourceCodePlatform);

const getAccessTokenWithAdminPermissions = async (site, users, sourceCodePlatform) =>
  getAccessTokenWithCertainPermissions(site, users, 'admin', sourceCodePlatform);

const loadBuildUserAccessToken = async (build) => {
  let accessToken;
  const site = build.Site;
  const users = await build.getSiteOrgUsers();
  const buildUser = users.find((u) => u.id === build.user);

  if (buildUser) {
    accessToken = await getAccessTokenWithPushPermissions(
      site,
      [buildUser],
      site.sourceCodePlatform,
    );
  }
  if (!accessToken) {
    /**
     * an anonymous user (i.e. not through federalist) has pushed
     * an update, we need to find a valid GitHub access token among the
     * site's current users with which to report the build's status
     */
    accessToken = await getAccessTokenWithPushPermissions(
      site,
      users,
      site.sourceCodePlatform,
    );
  }

  if (!accessToken) {
    throw new Error(
      `Unable to find valid access token to report build@id=${build.id} status`,
    );
  }
  return accessToken;
};

module.exports = {
  isWorkshop,
  createSiteWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  getSourceCodePlatformDomain,
  getTokenForSiteBuild,
  getProcessedGitLabWebhookPayload,
  getGitLabProjectToCreateSite,
  loadBuildUserAccessToken,
};
