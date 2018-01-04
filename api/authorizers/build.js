const { User, Build } = require('../models');
const buildErrors = require('../responses/buildErrors');

const verifyBuild = (model) => {
  const build = model && model.Builds && model.Builds[0];

  if (!build) {
    return Promise.reject({
      status: 403,
      message: buildErrors.UNABLE_TO_BUILD,
    });
  }

  return build.get({ plain: true });
};

const getBuildById = (user, params) => {
  const { buildId, siteId } = params;

  return User.findById(user.id, {
    include: {
      model: Build,
      where: { site: siteId, id: buildId },
    },
  })
  .then(verifyBuild);
};

const getBuildByBranch = (user, params) => {
  const { siteId, sha, branch } = params;

  return User.findById(user.id, {
    include: {
      model: Build,
      where: {
        branch,
        site: siteId,
      },
      order: [['createdAt', 'desc']],
      limit: 1,
    },
  })
  .then(verifyBuild)
  .then(build => Object.assign({}, build, { commitSha: sha }));
};

const authorize = (user, params) => {
  const finderFn = params.buildId ? getBuildById : getBuildByBranch;

  return finderFn(user, params);
};

const findOne = (user, params) => authorize(user, params);
const create = (user, params) => authorize(user, params);

module.exports = { findOne, create };
