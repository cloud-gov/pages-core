const url = require('url');
const GitHub = require('./GitHub');
const config = require('../../config');

// Loops through supplied list of users, until it
// finds a user with a valid access token
const getAccessTokenWithCertainPermissions = async (site, users, permission) => {
  let count = 0;
  const filteredUsers = users
    .filter((u) => u.githubAccessToken && u.signedInAt)
    .sort((a, b) => b.signedInAt - a.signedInAt);

  const getNextToken = async (user) => {
    try {
      if (!user) {
        return null;
      }

      const permissions = await GitHub.checkPermissions(
        user,
        site.owner,
        site.repository,
      );

      if (permissions[permission]) {
        return user.githubAccessToken;
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

const getAccessTokenWithPushPermissions = async (site, users) =>
  getAccessTokenWithCertainPermissions(site, users, 'push');

const getAccessTokenWithAdminPermissions = async (site, users) =>
  getAccessTokenWithCertainPermissions(site, users, 'admin');

const createSiteWebhook = async (site, users) => {
  const githubAccessToken = await getAccessTokenWithAdminPermissions(site, users);
  return GitHub.setWebhook(site, githubAccessToken);
};

const listSiteWebhooks = async (site, users) => {
  const githubAccessToken = await getAccessTokenWithAdminPermissions(site, users);
  return GitHub.listSiteWebhooks(site, githubAccessToken);
};

const loadBuildUserAccessToken = async (build) => {
  let githubAccessToken;
  const site = build.Site;
  const users = await build.getSiteOrgUsers();
  const buildUser = users.find((u) => u.id === build.user);
  if (buildUser) {
    githubAccessToken = await getAccessTokenWithPushPermissions(site, [buildUser]);
  }
  if (!githubAccessToken) {
    /**
     * an anonymous user (i.e. not through federalist) has pushed
     * an update, we need to find a valid GitHub access token among the
     * site's current users with which to report the build's status
     */
    githubAccessToken = await getAccessTokenWithPushPermissions(site, users);
  }

  if (!githubAccessToken) {
    throw new Error(
      `Unable to find valid access token to report build@id=${build.id} status`,
    );
  }
  return githubAccessToken;
};

const reportBuildStatus = async (build) => {
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (!sha) {
    throw new Error('Build or commit sha undefined. Unable to report build status');
  }

  const accessToken = await loadBuildUserAccessToken(build);

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
  } else if (build.state === 'error') {
    options.state = 'error';
    options.target_url = url.resolve(
      config.app.hostname,
      `/sites/${site.id}/builds/${build.id}/logs`,
    );
    options.description =
      'The build has encountered an error. Click "Details" to see the Pages build logs.';
  }
  return GitHub.sendCreateGithubStatusRequest(accessToken, options);
};

const fetchContent = async (build, path) => {
  if (!build.clonedCommitSha) {
    throw new Error(
      `Build or commit sha undefined. Unable to fetch ${path} for build@id=${build.id}`,
    );
  }

  const accessToken = await loadBuildUserAccessToken(build);
  const { owner, repository } = build.Site;
  return GitHub.getContent(accessToken, owner, repository, path, build.clonedCommitSha);
};

module.exports = {
  createSiteWebhook,
  listSiteWebhooks,
  reportBuildStatus,
  fetchContent,
  loadBuildUserAccessToken,
};
