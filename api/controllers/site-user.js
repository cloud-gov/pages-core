const authorizer = require('../authorizers/site');
const siteSerializer = require('../serializers/site');
const { Site, SiteUser } = require('../models');

module.exports = {
  update: (req, res) => {
    let site;
    Promise.resolve(Number(req.params.site_id))
    .then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Site.findById(id);
    }).then((model) => {
      site = model;
      if (!site) {
        throw 404;
      }
      return authorizer.update(req.user, site);
    })
    .then(() => SiteUser.findOne({ where: { user_sites: req.user.id, site_users: site.id } }))
    .then((siteUser) => {
      if (!siteUser) {
        throw 404;
      }

      const params = Object.assign(site, req.body);
      const attrs = {};
      if (params.buildNotify) {
        attrs.buildNotify = params.buildNotify;
      }
      return siteUser.update(attrs);
    })
    .then(() => siteSerializer.serialize(site))
    .then((siteJSON) => {
      res.json(siteJSON);
    })
    .catch((err) => {
      res.error(err);
    });
  },
};
