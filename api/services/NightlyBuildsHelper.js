const { Op } = require('sequelize');
const {
  Build, SiteBranchConfig, User,
} = require('../models');

const { USER_AUDITOR } = process.env;

class NightlyBuildError extends Error {
  constructor(build, cause) {
    super(build);
    this.stack = `${build}\n  ${cause.stack}`;
  }
}

const buildBranch = (siteId, branch) => User.findOne({ where: { username: USER_AUDITOR } })
  .then(user => Build.create({
    site: siteId,
    user: user.id,
    branch,
    username: user.username,
  }))
  .then(build => build.enqueue())
  .then(() => `site:${siteId}@${branch}`)
  .catch((err) => {
    throw new NightlyBuildError(
      `site:${siteId}@${branch}`,
      err
    );
  });

const siteBranchBuilds = ({ siteId, branch, config }) => {
  if (config && config.schedule === 'nightly') {
    return buildBranch(siteId, branch);
  }

  return null;
};

const query = {
  where: {
    [Op.and]: {
      branch: {
        [Op.ne]: null,
      },
      config: {
        schedule: {
          [Op.eq]: 'nightly',
        },
      },
    },
  },
};

const nightlyBuilds = async () => {
  const sbcs = await SiteBranchConfig.findAll(query);

  const builds = sbcs.map(siteBranchBuilds).filter(i => i);

  return Promise.allSettled(builds);
};

module.exports = { nightlyBuilds };
