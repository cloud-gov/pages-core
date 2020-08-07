const { Op } = require('sequelize');
const { Build, Site, User } = require('../models');

const { USER_AUDITOR } = process.env;

class NightlyBuildError extends Error {
  constructor(build, cause) {
    super(build);
    this.stack = `${build}\n  ${cause.stack}`;
  }
}

const buildBranch = (site, branch) => User
  .findOne({ where: { username: USER_AUDITOR } })
  .then(user => Build.create({
    site: site.id,
    user: user.id,
    branch,
  }))
  .then(build => build.enqueue())
  .then(() => `${site.owner}/${site.repository}@${branch}`)
  .catch((err) => {
    throw new NightlyBuildError(`${site.owner}/${site.repository}@${branch}`, err);
  });

const siteBranches = (site) => {
  const builds = [];
  if (site.defaultConfig && site.defaultConfig.schedule === 'nightly') {
    builds.push(buildBranch(site, site.defaultBranch));
  }

  if (site.demoConfig && site.demoConfig.schedule === 'nightly') {
    builds.push(buildBranch(site, site.demoBranch));
  }
  return builds;
};

const query = {
  where: {
    [Op.or]: [
      {
        [Op.and]: {
          defaultBranch: {
            [Op.ne]: null,
          },
          defaultConfig: {
            schedule: {
              [Op.eq]: 'nightly',
            },
          },
        },
      },
      {
        [Op.and]: {
          demoBranch: {
            [Op.ne]: null,
          },
          demoConfig: {
            schedule: {
              [Op.eq]: 'nightly',
            },
          },
        },
      },
    ],
  },
};

const nightlyBuilds = async () => {
  const sites = await Site.findAll(query);

  const builds = sites
    .map(siteBranches)
    .flat();

  return Promise.allSettled(builds);
};

module.exports = { nightlyBuilds };
