const siteSerializer = require('../serializers/site');
const { SiteUser } = require('../models');
const { toInt } = require('../utils');

module.exports = {
  updateNotificationSettings: (req, res) => {
    const siteId = toInt(req.params.site_id);
    if (!siteId) {
      throw 404;
    }

    SiteUser.findOne({ where: { user_sites: req.user.id, site_users: siteId } })
      .then((siteUser) => {
        if (!siteUser) {
          throw 404;
        }

        const attrs = {};
        if (req.body.buildNotificationSetting) {
          attrs.buildNotificationSetting = req.body.buildNotificationSetting;
        }
        return siteUser.update(attrs);
      })
      .then(siteUser => siteSerializer.serialize({ id: siteUser.site_users }))
      .then(siteJSON => res.json(siteJSON))
      .catch(res.error);
  },
};
