const { User, Build, Site } = require('../models');
const buildErrors = require('../responses/buildErrors');
const GitHub = require('../services/GitHub');

const rejectBuild = () =>
  Promise.reject({
    status: 403,
    message: buildErrors.UNABLE_TO_BUILD,
  });

const getBranch = ({ user, site, branchName }) =>
  GitHub.getBranch(user, site.owner, site.repository, branchName)
  .then(branch => ({
    branch: branch.name,
    site: site.id,
    commitSha: branch.commit.sha,
  }))
  .catch(rejectBuild);

const buildExists = user => user && user.Builds && user.Builds[0];

const getBuildById = (user, params) => {
  const { buildId, siteId } = params;

  return User.findById(user.id, {
    include: [{
      model: Build,
      where: { site: siteId, id: buildId },
    }, {
      model: Site,
      where: { id: siteId },
    }],
  })
  .then((model) => {
    const build = buildExists(model);

    if (build) {
      return build;
    }

    return rejectBuild();
  });
};

const getBuildByBranch = (user, params) => {
  const { siteId, sha, branch } = params;

  return User.findById(user.id, {
    include: [{
      model: Build,
      where: {
        branch,
        site: siteId,
      },
      order: [['createdAt', 'desc']],
      limit: 1,
    }, {
      model: Site,
      where: { id: siteId },
      attributes: ['id', 'owner', 'repository'],
    }],
  })
  .then((model) => {
    const build = buildExists(model);

    if (build) {
      return Object.assign({}, build.toJSON(), { commitSha: sha });
    }

    const site = user.Sites[0];

    return getBranch({ model, site, branch });
  });
};

const authorize = (user, params) => {
  const finderFn = params.buildId ? getBuildById : getBuildByBranch;

  return finderFn(user, params);
};

const findOne = (user, params) => authorize(user, params);
const create = (user, params) => authorize(user, params);

module.exports = { findOne, create };
