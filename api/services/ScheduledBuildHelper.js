const yaml = require('js-yaml');
const { Op } = require('sequelize');
const { logger } = require('../../winston');
const { Build, Site, User } = require('../models');

const buildBranch = (site, branch) => 
  User.findOne({ where: { username: process.env.USER_AUDITOR } })
    .then((user) => Build.create({
      site: site.id,
      user: user.id,
      branch,
    }))
    .catch(err => {
      logger.error(`Error creating build: ${site.owner}/${site.repository}\@${branch}\n${err}`);
    });
    

const buildSite = (site) =>
  Promise.resolve(yaml.safeLoad(site.config))
  .then(config => {
    if (config.schedule === 'nightly') {
      return buildBranch(site, site.defaultBranch);
    }
    return Promise.resolve();
  })
  .catch(err =>
    logger.error(`Error siteBuilds: (${site.owner}/${site.repository}\@${site.demoBranch})\n${err}`))
  .then(() => Promise.resolve(yaml.safeLoad(site.demoConfig)))
  .then(demoConfig => {
    if (demoConfig.schedule === 'nightly') {
      return buildBranch(site, site.demoBranch);
    }
    return Promise.resolve();
  })
  .catch(err =>
    logger.error(`Error siteBuilds: (${site.owner}/${site.repository}\@${site.demoBranch})\n${err}`));

const nightlyBuilds = () =>
  Site.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: {
            defaultBranch: {
              [Op.ne]: null
            },
            config: {
              [Op.like]: '%schedule: nightly%'
            },
          },
          [Op.and]: {
            demoBranch: {
              [Op.ne]: null
            },
            demoConfig: {
              [Op.like]: '%schedule: nightly%'
            },
          },
        }
      ],
    }
  })
  .then((sites) => Promise.all(sites.map(site => buildSite(site))))
  .catch(err => logger.error(`Error scheduling all builds\n${err}`));

  

module.exports = { nightlyBuilds };
