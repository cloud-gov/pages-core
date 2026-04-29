const { Site } = require('../models');
const Github = require('./GitHub');
const GithubBuildHelper = require('./GithubBuildHelper');
const GitLabHelper = require('./GitLabHelper');
const GitHub = require('./GitHub');
const { domain } = require('../utils/build');
const config = require('../../config');
const url = require('url');
const Organization = require('./organization');
const siteErrors = require('../responses/siteErrors');
const { PAGES_ACCESS_LEVELS_DESTROY_SITE } = require('./GitLabHelper');
const { logger } = require('../../winston');

const isWorkshopPlatform = (sourceCodePlatform) =>
  sourceCodePlatform === Site.Platforms.Workshop;
const isWorkshopUrl = (url) => url?.startsWith(GitLabHelper.getGitLabBaseUrl());

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

  const workshop = isWorkshopPlatform(site.sourceCodePlatform);

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
  if (isWorkshopPlatform(site.sourceCodePlatform)) {
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
  isWorkshopPlatform(site.sourceCodePlatform)
    ? await GitLabHelper.listSiteWebhooks(user, site)
    : await GithubBuildHelper.listSiteWebhooks(
        site,
        users,
        getAccessTokenWithAdminPermissions,
      );

const getSourceCodePlatformDomain = (sourceCodePlatform) =>
  isWorkshopPlatform(sourceCodePlatform)
    ? domain(GitLabHelper.getGitLabBaseUrl())
    : domain(config.app.githubBaseUrl);

const getTokenForSiteBuild = async (build) => {
  const workshop = isWorkshopPlatform(build.Site?.sourceCodePlatform);
  let token = workshop
    ? build.User && (await GitLabHelper.getUserOAuthAccessToken(build.User))
    : build.User?.githubAccessToken;
  if (!token) token = await loadBuildUserAccessToken(build);

  return workshop ? `${GitLabHelper.OAUTH_PREFIX}:${token}` : token;
};

const mapWebhookResponseToGitHubFormat = (payload) =>
  GitLabHelper.mapWebhookResponseToGitHubFormat(payload);

const getGitLabProjectToCreateSite = async (user, sourceCodeUrl) =>
  await GitLabHelper.getGitLabProjectToCreateSite(user, sourceCodeUrl);

const getUsersWithGitHubToken = (users) =>
  users
    .filter((u) => u.githubAccessToken && u.signedInAt)
    .sort((a, b) => b.signedInAt - a.signedInAt);

const getUsersWithGitLabToken = (users) =>
  users
    .filter((u) => u.gitlabToken)
    .sort((a, b) => b.gitlabExpiresAt - a.gitlabExpiresAt); // ????

const authorizeToDestroySite = async (user, site) => {
  if (isWorkshopPlatform(site.sourceCodePlatform)) {
    const {
      userResponseOk,
      canCreateProject,
      projectUserResponseOk,
      projectUserResponseStatus,
      accessLevel,
    } = await GitLabHelper.getProjectAccessLevel(user, site.sourceCodeUrl);
    if (!userResponseOk) {
      throw {
        message: siteErrors.CAN_NOT_RETRIEVE_USER_GITLAB_INFORMATION,
        status: 403,
      };
    }

    if (!projectUserResponseOk) {
      if (projectUserResponseStatus === 404) {
        if (canCreateProject) return site.id;
        throw {
          message: siteErrors.GITLAB_ACCESS_REQUIRED_FOR_DELETED_GITLAB_PROJECT,
          status: 403,
        };
      }
      throw {
        message: siteErrors.CAN_NOT_RETRIEVE_USER_GITLAB_PROJECT_AUTHORIZATION,
        status: 403,
      };
    }

    if (!PAGES_ACCESS_LEVELS_DESTROY_SITE.includes(accessLevel)) {
      throw {
        message: siteErrors.DELETE_SITE_GITLAB_ACCESS_REQUIRED,
        status: 403,
      };
    }
    return site.id;
  } else {
    return GitHub.getRepoPermissions(user, site.owner, site.repository)
      .then((permissions) => {
        if (!permissions.admin) {
          throw {
            message: siteErrors.ADMIN_ACCESS_REQUIRED,
            status: 403,
          };
        }
        return site.id;
      })
      .catch((error) => {
        if (error.status === 404) {
          // authorize user if the site's repo does not exist:
          // When a user attempts to delete a site after deleting the repo, Federalist
          // attempts to fetch the repo but it no longer exists and receives a 404
          return site.id;
        }
        throw {
          message: siteErrors.ADMIN_ACCESS_REQUIRED,
          status: 403,
        };
      });
  }
};

// Loops through supplied list of users, until it
// finds a user with a valid access token
const getAccessTokenWithCertainPermissions = async (site, users, permission) => {
  let count = 0;

  if (!users) {
    return null;
  }

  const isWorkshop = isWorkshopPlatform(site.sourceCodePlatform);
  const filteredUsers = isWorkshop
    ? getUsersWithGitLabToken(users)
    : getUsersWithGitHubToken(users);
  logger.info(filteredUsers.map((user) => `${user.id} - ${user.username}`));

  const getNextToken = async (user) => {
    try {
      if (!user) {
        return null;
      }

      const permissions = isWorkshop
        ? await GitLabHelper.getProjectPermissions(user, site.sourceCodeUrl)
        : await GitHub.getRepoPermissions(user, site.owner, site.repository);
      logger.info(`${user?.id} - ${user?.username} - ${JSON.stringify(permissions)}`);

      if (permissions[permission]) {
        const token = isWorkshop ? user.gitlabToken : user.githubAccessToken;
        return token;
      }
      count += 1;
      return getNextToken(filteredUsers[count]);
    } catch (error) {
      logger.error(
        [
          `Error retrieving token for - ${user?.id} - ${user?.username}`,
          error.message,
          error.stack,
        ].join('\n'),
      );

      count += 1;
      return count < filteredUsers.length ? getNextToken(filteredUsers[count]) : null;
    }
  };

  return getNextToken(filteredUsers[count]);
};

const getAccessTokenWithPushPermissions = async (site, users) =>
  getAccessTokenWithCertainPermissions(site, users, 'push');

const getAccessTokenWithAdminPermissions = async (site, users) =>
  getAccessTokenWithCertainPermissions(site, users, 'admin');

const loadBuildUserAccessToken = async (build) => {
  let accessToken;
  const site = build.Site;
  const users = await build.getSiteOrgUsers();
  const buildUser = users.find((u) => u?.id === build.user);

  if (buildUser) {
    accessToken = await getAccessTokenWithPushPermissions(site, [buildUser]);
  }
  if (!accessToken) {
    /**
     * an anonymous user (i.e. not through federalist) has pushed
     * an update, we need to find a valid GitHub access token among the
     * site's current users with which to report the build's status
     */
    accessToken = await getAccessTokenWithPushPermissions(site, users);
  }

  if (!accessToken) {
    throw new Error(
      `Unable to find valid access token to report build@id=${build.id} status`,
    );
  }
  return accessToken;
};

const createRepoFromTemplate = async ({
  user,
  owner,
  repository,
  namespace,
  project,
  template,
}) => {
  if (isWorkshopUrl(template?.templateSourceCodeUrl)) {
    const projectResponse = await GitLabHelper.createProjectFromTemplate(
      user,
      namespace,
      project,
      template?.templateSourceCodeUrl,
    );
    return await projectResponse.json();
  } else return await GitHub.createRepoFromTemplate(user, owner, repository, template);
};

const deleteWebhook = async (site, user) =>
  isWorkshopPlatform(site.sourceCodePlatform)
    ? await GitLabHelper.deleteWebhook(user, site)
    : await Github.deleteWebhook(site, user.githubAccessToken);

module.exports = {
  isWorkshopPlatform,
  isWorkshopUrl,
  createSiteWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  getSourceCodePlatformDomain,
  getTokenForSiteBuild,
  mapWebhookResponseToGitHubFormat,
  getGitLabProjectToCreateSite,
  loadBuildUserAccessToken,
  createRepoFromTemplate,
  deleteWebhook,
  authorizeToDestroySite,
};
