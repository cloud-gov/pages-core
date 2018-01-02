const { User, Build } = require('../models');

const shaRegex = /^[a-f0-9]{40}/;
const validateSha = maybeSha => shaRegex.test(maybeSha);

const normalizeParams = (params) => {
  const buildId = params.buildId || params.build.id;
  const siteId = params.siteId || params.site.id;

  return Object.assign({}, params, { buildId, siteId });
};

const verifyBuild = (model) => {
  const build = model && model.Builds && model.Builds[0];

  if (!build) {
    return Promise.reject(403);
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

  if (!validateSha(sha)) {
    throw 400;
  }

  return User.findById(user.id, {
    include: {
      model: Build,
      where: {
        branch,
        site: siteId,
      },
      order: User.sequelize.literal('"createdAt" desc'),
      limit: 1,
    },
  })
  .then(verifyBuild)
  .then(build => Object.assign({}, build, { commitSha: sha }));
};

const authorize = (user, params) => {
  const normalized = normalizeParams(params);
  const finderFn = params.buildId ? getBuildById : getBuildByBranch;

  return finderFn(user, params);
};

const findOne = (user, params) => authorize(user, params);
const create = (user, params) => authorize(user, params);

module.exports = { findOne, create };
