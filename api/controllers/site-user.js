const authorizer = require('../authorizers/site');
const siteSerializer = require('../serializers/site');
const { Site, SiteUser } = require('../models');

module.exports = {
  update: (req, res) => {
    Promise.resolve(Number(req.params.site_id))
    .then((site_id) => {
      if (isNaN(site_id)) {
        throw 404;
      }
      // same function as site authorizer
      return SiteUser.findOne({ where: { user_sites: req.user.id, site_users: site_id } });
    })
    .then((siteUser) => {
      if (!siteUser) {
        throw 404;
      }

      const attrs = {};
      if (req.body.buildNotify) {
        attrs.buildNotify = req.body.buildNotify;
      }
      return siteUser.update(attrs);
    })
    .then(siteUser => siteSerializer.serialize({ id: siteUser.site_users }))
    .then(siteJSON => res.json(siteJSON))
    .catch(res.error);
  },
};
