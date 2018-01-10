const { User, Build, Site } = require('../models');
const buildErrors = require('../responses/buildErrors');
const Github = require('../services/Github');

const rejectBuild = () =>
  Promise.reject({
    status: 403,
    message: buildErrors.UNABLE_TO_BUILD,
  });

const verifyBuild = (model, branch) => {
  const site = model && model.Sites && model.Sites[0];

  return Github.getBranch({ model, build, site, branch })
  .then(build => {
    return {
      branch: build.name,
      site: site.id,
      commitSha: build.commit.sha,
    };
  })
  .catch(rejectBuild);
};

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
    const build = model && model.Builds && model.Builds[0];

    if (!build) {
      return rejectBuild();
    }

    return build.get({ plain: true });
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
      attributes: [ 'id', 'owner', 'repository' ]
    }],
  })
  .then(model => verifyBuild(model, branch));
};

const authorize = (user, params) => {
  const finderFn = params.buildId ? getBuildById : getBuildByBranch;

  return finderFn(user, params);
};

const findOne = (user, params) => authorize(user, params);
const create = (user, params) => authorize(user, params);

module.exports = { findOne, create };
