const siteSerializer = require('../serializers/site');
const { SiteUser, Event } = require('../models');
const EventCreator = require('../services/EventCreator');
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
      .catch((err) => {
        const errBody = {
          message: 'Error updating site user notification settings',
          error: err.stack,
          request: {
            params: req.params,
            body: req.body,
            path: req.path,
          },
        };
        EventCreator.error(Event.labels.SITE_USER, errBody);
        res.error(err);
      });
  },
};
