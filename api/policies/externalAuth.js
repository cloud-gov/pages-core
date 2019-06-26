const { Op } = require('sequelize');
const { Site } = require('../models');

module.exports = function externalAuth(req, res, next) {
  if (req.query && req.query.site_id) {
    const siteId = req.query.site_id;
    const domain = `https://${siteId}`;
    const awsBucketName = siteId.split('.')[0];
    return Site.findOne({
      where: { [Op.or]: [{ domain }, { demoDomain: domain }, { awsBucketName }] },
    })
    .then((site) => {
      if (site && site.isS3BucketDedicated()) {
        return next();
      }
      return res.forbidden({
        message: 'You are not permitted to perform this action.',
      });
    })
    .catch(() => res.forbidden({
      message: 'You are not permitted to perform this action.',
    }));
  }
  return res.forbidden({
    message: 'You are not permitted to perform this action.',
  });
};
