const { User, Build, Site } = require('../models');
const buildErrors = require('../responses/buildErrors');
const GitHub = require('../services/GitHub');

const rejectBuild = () =>
  Promise.reject({
    status: 403,
    message: buildErrors.UNABLE_TO_BUILD,
  });

const getBranch = ({ user, site, branch }) =>
  GitHub.getBranch(user, site.owner, site.repository, branch)
  .then(branchInfo => ({
    branch: branchInfo.name,
    site: site.id,
    commitSha: branchInfo.commit.sha,
  }))
  .catch(rejectBuild);

const getBuild = user => user && user.Builds && user.Builds[0];

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
    const build = getBuild(model);

    if (build) {
      return build;
    }

    return rejectBuild();
  });
};

const getBuildByBranch = (user, params) => {
  const { siteId, sha, branch } = params;

  return User.findOne({
    where: { id: user.id },
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
    const build = getBuild(model);

    // The branch we want to create a new build from has been built via federalist before
    if (build) {
      return Object.assign({}, build.toJSON(), { commitSha: sha });
    }

    const site = model.Sites[0];

    // We don't have a build record, using this branch, go to github and check if the
    // requested branch is a valid one for the current site.
    return getBranch({ user: model, site, branch });
  });
};

const authorize = (user, params) => {
  const finderFn = params.buildId ? getBuildById : getBuildByBranch;

  return finderFn(user, params);
};

const findOne = (user, params) => authorize(user, params);
const create = (user, params) => authorize(user, params);

module.exports = { findOne, create };
