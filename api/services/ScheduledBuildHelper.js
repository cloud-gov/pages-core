const { Op } = require('sequelize');
const { logger } = require('../../winston');
const { Build, Site, User } = require('../models');

const buildBranch = (site, branch) => User
  .findOne({ where: { username: process.env.USER_AUDITOR } })
  .then(user => Build.create({
    site: site.id,
    user: user.id,
    branch,
  }))
  .catch(err => logger.error(`Error siteBuilds: (${site.owner}/${site.repository}@${site.branch})\n${err}`));

const buildSite = (site) => {
  const builds = [];
  if (site.defaultConfig && site.defaultConfig.schedule === 'nightly') {
    builds.push(buildBranch(site, site.defaultBranch));
  }

  if (site.demoConfig && site.demoConfig.schedule === 'nightly') {
    builds.push(buildBranch(site, site.demoBranch));
  }
  return Promise.all(builds);
};

const nightlyBuilds = () => Site.findAll({
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
})
  .then(sites => Promise.all(sites.map(site => buildSite(site))));

module.exports = { nightlyBuilds };
