const { Op } = require('sequelize');
const url = require('url');
const { Site } = require('../models');

module.exports = function externalAuth(req, res, next) {
  if(req.query && req.query.site_id) {
    const site_id = url.parse(req.query.site_id)
    const domain = `${site_id.protocol}//${site_id.host}`
    return Site.findOne({
      where: {
        [Op.or]: [
          { domain },
          { demoDomain: domain },
          {awsBucketName: site_id.host.split('.')[0]},
        ]
      }
    })
    .then((site) => {
      if (site && site.isS3BucketDedicated()) {
        return next();
      }
      return res.forbidden({
        message: 'You are not permitted to perform this action.',
      });
    })
    .catch((e) => {
      return res.forbidden({
        message: 'You are not permitted to perform this action.',
      });
    });
  }
  return res.forbidden({
    message: 'You are not permitted to perform this action.',
  });
};
