const { Op } = require('sequelize');
const { Site } = require('../models');

module.exports = function externalAuth(req, res, next) {
  if(req.query && req.query.site_id) {
    const site_id = req.query.site_id
    const domain = `https://${site_id}`
    return Site.findOne({
      where: {
        [Op.or]: [
          { domain },
          { demoDomain: domain },
          {awsBucketName: site_id.split('.')[0]},
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
