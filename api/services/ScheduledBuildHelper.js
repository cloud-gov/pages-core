const yaml = require('js-yaml');
const { Op } = require('sequelize');
const { logger } = require('../../winston');
const { Build, Site, User } = require('../models');

const buildBranch = (site, branch) =>
  User.findOne({ where: { username: process.env.USER_AUDITOR } })
    .then(user =>
      Build.create({
        site: site.id,
        user: user.id,
        branch,
      })
    );

const buildSite = site =>
  Promise.resolve(yaml.safeLoad(site.defaultConfig))
  .then((config) => {
    if (config.schedule === 'nightly') {
      return buildBranch(site, site.defaultBranch);
    }
    return Promise.resolve();
  })
  .catch(err =>
    logger.error(`Error siteBuilds: (${site.owner}/${site.repository}@${site.demoBranch})\n${err}`))
  .then(() => Promise.resolve(yaml.safeLoad(site.demoConfig)))
  .then((demoConfig) => {
    if (site.demoBranch && demoConfig.schedule === 'nightly') {
      return buildBranch(site, site.demoBranch);
    }
    return Promise.resolve();
  })
  .catch(err =>
    logger.error(`Error siteBuilds: (${site.owner}/${site.repository}@${site.demoBranch})\n${err}`));

const nightlyBuilds = () =>
  Site.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: {
            defaultBranch: {
              [Op.ne]: null,
            },
            config: {
              [Op.like]: '%schedule: nightly%',
            },
          },
        },
        {
          [Op.and]: {
            demoBranch: {
              [Op.ne]: null,
            },
            demoConfig: {
              [Op.like]: '%schedule: nightly%',
            },
          },
        },
      ],
    },
  })
  .then(sites => Promise.all(sites.map(site => buildSite(site))));

module.exports = { nightlyBuilds };
