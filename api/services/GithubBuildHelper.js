const { Site } = require('../models');
const GitHub = require('./GitHub');

const createSiteWebhook = async (site, users, getAccessTokenWithAdminPermissions) => {
  const githubAccessToken = await getAccessTokenWithAdminPermissions(
    site,
    users,
    Site.Platforms.Github,
  );
  return GitHub.setWebhook(site, githubAccessToken);
};

const listSiteWebhooks = async (site, users, getAccessTokenWithAdminPermissions) => {
  const githubAccessToken = await getAccessTokenWithAdminPermissions(
    site,
    users,
    Site.Platforms.Github,
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
