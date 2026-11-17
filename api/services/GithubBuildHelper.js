const GitHub = require('./GitHub');
const { CustomError } = require('../utils/validators');

const requireAdminToken = async (site, users, getAccessTokenWithAdminPermissions) => {
  const token = await getAccessTokenWithAdminPermissions(site, users);
  if (!token) {
    throw new CustomError(
      'No valid GitHub token with repository-admin permissions is available. ' +
        'A repository administrator in the site organization must reconnect GitHub.',
      403,
    );
  }
  return token;
};

const createSiteWebhook = async (site, users, getAccessTokenWithAdminPermissions) => {
  const githubAccessToken = await requireAdminToken(
    site,
    users,
    getAccessTokenWithAdminPermissions,
  );
  return GitHub.setWebhook(site, githubAccessToken);
};

const listSiteWebhooks = async (site, users, getAccessTokenWithAdminPermissions) => {
  const githubAccessToken = await requireAdminToken(
    site,
    users,
    getAccessTokenWithAdminPermissions,
  );
  return GitHub.listSiteWebhooks(site, githubAccessToken);
};

const fetchContent = async (build, path, loadBuildUserAccessToken) => {
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
  fetchContent,
};
