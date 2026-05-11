const { Site, Event, User, Build } = require('../models');
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
const { gitlabLogError, gitlabLogUserInfo } = require('../utils/gitlabLogger');
const EventCreator = require('./EventCreator');
const { logger } = require('../../winston');

const BUILD_PERMISSION = 'push';

/* eslint-disable max-len */
const flows = {
  FLOW____CREATE_SITE: { description: 'FLOW____CREATE_SITE', refresh: true },
  FLOW_NEW_SITE_BUILD: { description: 'FLOW_NEW_SITE_BUILD', refresh: false }, // refresh is in FLOW____CREATE_SITE
  FLOW___CORE_REBUILD: { description: 'FLOW___CORE_REBUILD', refresh: true },
  FLOW__ADMIN_REBUILD: { description: 'FLOW__ADMIN_REBUILD', refresh: true },
  FLOW___BUILD_STATUS: { description: 'FLOW___BUILD_STATUS', refresh: false }, // refresh while creating a build
  FLOW__WEBHOOK_BUILD: { description: 'FLOW__WEBHOOK_BUILD', refresh: true },
  FLOW___DESTROY_SITE: { description: 'FLOW___DESTROY_SITE', refresh: true },
  FLOW___EDITOR_BUILD: { description: 'FLOW___EDITOR_BUILD', refresh: true },
  FLOW_____SBC_CREATE: { description: 'FLOW_____SBC_CREATE', refresh: true },
  FLOW_____SBC_UPDATE: { description: 'FLOW_____SBC_UPDATE', refresh: true },
  FLOW____DOMAIN_PROV: { description: 'FLOW____DOMAIN_PROV', refresh: true },
  FLOW__DOMAIN_DEPROV: { description: 'FLOW__DOMAIN_DEPROV', refresh: true },
  FLOW__NIGHTLY_BUILD: { description: 'FLOW__NIGHTLY_BUILD', refresh: true },
};
/* eslint-enable max-len */

const isWorkshopPlatform = (sourceCodePlatform) =>
  sourceCodePlatform === Site.Platforms.Workshop;
const isWorkshopUrl = (url) => url?.startsWith(GitLabHelper.getGitLabBaseUrl());

function getDescriptionInProgress(workshop) {
  // eslint-disable-next-line max-len
  return `The build is running. Click ${workshop ? '' : 'Details'} to see the Pages build status.`;
}

function getDescriptionSuccess(workshop) {
  // eslint-disable-next-line max-len
  return `The build is complete! Click ${workshop ? '' : 'Details'} to visit the Site Preview.`;
}

function getDescriptionError() {
  // eslint-disable-next-line max-len
  return `The build has encountered an error. Click "Details" to see the Pages build logs.`;
}

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
  const user = build.User;

  const workshop = isWorkshopPlatform(site.sourceCodePlatform);

  const options = {
    owner: site.owner,
    repo: site.repository,
    sha,
    context: workshop
      ? `${context} (buildId:${build.id}, user:${user?.gitlabUserId})`
      : context,
  };

  if (build.isInProgress()) {
    options.state = workshop ? GitLabHelper.GITLAB_COMMIT_STATE_RUNNING : 'pending';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description = getDescriptionInProgress(workshop);
  } else if (build.state === 'success') {
    options.state = workshop ? GitLabHelper.GITLAB_COMMIT_STATE_SUCCESS : 'success';
    options.target_url = build.url;
    options.description = getDescriptionSuccess(workshop);
  } else if (build.state === 'error' || build.state === 'invalid') {
    options.state = workshop ? GitLabHelper.GITLAB_COMMIT_STATE_FAILED : 'error';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description = getDescriptionError();
  }

  if (workshop) {
    // The build user token should already be refreshed at the start of the workflow.
    return await GitLabHelper.sendCommitState(user, site, options);
  } else {
    const accessToken = await loadBuildUserAccessToken(build);
    return await GitHub.sendCreateGithubStatusRequest(accessToken, options);
  }
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

const getTokenForSiteBuildQueue = async (build) => {
  const workshop = isWorkshopPlatform(build.Site?.sourceCodePlatform);
  let token = workshop ? build.User?.gitlabToken : build.User?.githubAccessToken;

  if (!token) {
    if (workshop) {
      logger.info(
        // eslint-disable-next-line max-len
        `GitLab: unexpected token refresh. the build user's token is expected to be refreshed at the start of the workflow rather than in the worker (buildId=${build.id}, user:${build.User?.id}-${build.User?.username})`,
      );
    }
    token = await loadBuildUserAccessToken(build);
  }

  return workshop ? token && `${GitLabHelper.OAUTH_PREFIX}:${token}` : token;
};

const mapWebhookRequestToGitHubFormat = (payload) =>
  GitLabHelper.mapWebhookRequestToGitHubFormat(payload);

const getGitLabProjectToCreateSite = async (user, sourceCodeUrl) =>
  await GitLabHelper.getGitLabProjectToCreateSite(user, sourceCodeUrl);

const getUsersWithGitHubToken = (users) =>
  users
    .filter((u) => u.githubAccessToken && u.signedInAt)
    .sort((a, b) => b.signedInAt - a.signedInAt);

const getUsersWithGitLabToken = (users) =>
  users
    .filter((u) => u.gitlabToken)
    .sort((a, b) => b.gitlabExpiresAt - a.gitlabExpiresAt);

const authorizeToDestroySite = async (user, site) => {
  if (isWorkshopPlatform(site.sourceCodePlatform)) {
    const {
      userResponseOk,
      canCreateProject,
      projectUserResponseOk,
      projectUserResponseStatus,
      accessLevel,
    } = await GitLabHelper.getUserProjectForDeletion(user, site.sourceCodeUrl);
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

const hasPermissions = async (user, site, permission, count = 0) => {
  const isWorkshop = isWorkshopPlatform(site.sourceCodePlatform);
  const permissions = isWorkshop
    ? await GitLabHelper.getProjectPermissions(user, site.sourceCodeUrl)
    : await GitHub.getRepoPermissions(user, site.owner, site.repository);

  logger.info(
    // eslint-disable-next-line max-len
    `GitLab: for user ${gitlabLogUserInfo(user)} permissions are ${JSON.stringify(permissions)}, loop counter: ${count}`,
  );

  return permissions[permission];
};

// Loops through supplied list of users, until it
// finds a user with a valid access token
const getUserAndTokenWithCertainPermissions = async (site, users, permission) => {
  if (!users) return null;

  const isWorkshop = isWorkshopPlatform(site.sourceCodePlatform);
  const filteredUsers = isWorkshop
    ? getUsersWithGitLabToken(users)
    : getUsersWithGitHubToken(users);

  const userList = filteredUsers?.map((u) => `${u?.id}-${u?.username}`).join(', ');
  logger.info(`filteredUsers - ${filteredUsers?.length} users: ${userList}`);

  let count = 0;
  const getNextToken = async (user) => {
    try {
      if (!user) return null;
      if (await hasPermissions(user, site, permission, count))
        return { user, token: isWorkshop ? user.gitlabToken : user.githubAccessToken };

      count += 1;
      return getNextToken(filteredUsers[count]);
    } catch (error) {
      gitlabLogError(
        error,
        `silent error retrieving token for user ${gitlabLogUserInfo(user)}`,
      );

      count += 1;
      return count < filteredUsers.length ? getNextToken(filteredUsers[count]) : null;
    }
  };

  return getNextToken(filteredUsers[count]);
};

const loadBuildUserAndAccessToken = async (build) => {
  const site = build.Site;
  const siteOrgUsers = await build.getSiteOrgUsers();

  const buildUser = siteOrgUsers?.find((u) => u?.id === build.user);

  const userGroups = [
    buildUser ? [buildUser] : null,
    siteOrgUsers?.length ? siteOrgUsers : null,
  ].filter(Boolean);

  for (const users of userGroups) {
    // eslint-disable-next-line no-await-in-loop
    const userAndToken = await getUserAndTokenWithCertainPermissions(
      site,
      users,
      BUILD_PERMISSION,
    );
    if (userAndToken?.token) return userAndToken;
  }

  throw new Error(
    `Unable to find a user with valid access token to report build@id=${build.id} status`,
  );
};

const loadBuildUser = async (build) => (await loadBuildUserAndAccessToken(build))?.user;

const loadBuildUserAccessToken = async (build) =>
  (await loadBuildUserAndAccessToken(build))?.token;

const getAccessTokenWithAdminPermissions = async (site, users) =>
  (await getUserAndTokenWithCertainPermissions(site, users, 'admin'))?.token;

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

const isWorkshopSiteAndRefreshTokenFlow = (sourceCodePlatform, flow) =>
  isWorkshopPlatform(sourceCodePlatform) && flow?.refresh;

const refreshUserGitLabTokenIfNeeded = async (
  user,
  sourceCodePlatform,
  flow,
  now = Date.now(),
) => {
  const workshopSiteAndRefreshTokenFlow = isWorkshopSiteAndRefreshTokenFlow(
    sourceCodePlatform,
    flow,
  );

  logger.info(
    // eslint-disable-next-line max-len
    `GitLab: build user token refresh for flow ${flow?.description} ${workshopSiteAndRefreshTokenFlow ? 'might be required.' : 'is not required.'}`,
  );

  if (workshopSiteAndRefreshTokenFlow) {
    await GitLabHelper.refreshUserGitLabTokenIfNeeded(user, now, flow?.description);
  }
};

const getBuildUserWithPermissions = async (build) =>
  build.User?.gitlabToken &&
  (await hasPermissions(build.User, build.Site, BUILD_PERMISSION))
    ? build.User
    : null;

const getLastSuccessfulBuildUserWithPermissions = async (build) => {
  const lastSuccessfulBuild = await Build.scope(
    Build.siteScopeLastSuccessfulBuild(build.Site.id),
  ).findOne();
  return lastSuccessfulBuild
    ? await getBuildUserWithPermissions(lastSuccessfulBuild)
    : null;
};

async function getOrganizationUserPermissions(build, flow) {
  try {
    const newBuildUser = await loadBuildUser(build);
    if (newBuildUser) return newBuildUser;
  } catch (error) {
    gitlabLogError(
      error,
      // eslint-disable-next-line max-len
      `silent error loading build user for build ${build.id} in flow ${flow?.description}`,
    );
    EventCreator.error(Event.labels.TOKEN_ACTION, error, {
      flow: flow.description,
      build: {
        id: build.id,
      },
    });
  }
  return null;
}

const ensureBuildUserWithFreshGitLabToken = async (build, flow, now = Date.now()) => {
  await build.reload({ include: [Site, User] });
  const { Site: site } = build;

  if (isWorkshopSiteAndRefreshTokenFlow(site.sourceCodePlatform, flow)) {
    logger.info(
      `GitLab: resolving build user with a fresh token in flow ${flow?.description}`,
    );
    const getBuildUserMethods = [
      { method: getBuildUserWithPermissions, methodName: 'getBuildUserWithPermissions' },
      {
        method: getLastSuccessfulBuildUserWithPermissions,
        methodName: 'getLastSuccessfulBuildUserWithPermissions',
      },
      {
        method: getOrganizationUserPermissions,
        methodName: 'getOrganizationUserPermissions',
      },
    ];

    let buildUser;
    /* eslint-disable no-await-in-loop */
    for (const getBuildUserMethod of getBuildUserMethods) {
      try {
        buildUser = await getBuildUserMethod.method(build, flow);
        if (buildUser) {
          logger.info(`GitLab: found build user in ${getBuildUserMethod.methodName}()`);
          await build.update({ user: buildUser?.id });
          await build.reload({ include: [User] });
          await refreshUserGitLabTokenIfNeeded(
            buildUser,
            site.sourceCodePlatform,
            flow,
            now,
          );
          break;
        }
      } catch (error) {
        gitlabLogError(
          error,
          `error trying to find build user in ${getBuildUserMethod.methodName}()`,
        );
      }
    }
    /* eslint-enable no-await-in-loop */
  }
};

module.exports = {
  flows,
  isWorkshopPlatform,
  isWorkshopUrl,
  createSiteWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  getSourceCodePlatformDomain,
  getTokenForSiteBuildQueue,
  mapWebhookRequestToGitHubFormat,
  getGitLabProjectToCreateSite,
  loadBuildUser,
  createRepoFromTemplate,
  deleteWebhook,
  authorizeToDestroySite,
  refreshUserGitLabTokenIfNeeded,
  ensureBuildUserWithFreshGitLabToken,
  loadBuildUserAccessToken,
  getLastSuccessfulBuildUserWithPermissions,
};
