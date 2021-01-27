const siteSerializer = require('../serializers/site');
const { SiteUser } = require('../models');
const { toInt, wrapHandlers } = require('../utils');

module.exports = wrapHandlers({
  async updateNotificationSettings(req, res) {
    const siteId = toInt(req.params.site_id);
    if (!siteId) {
      return res.notFound();
    }

    const siteUser = await SiteUser.findOne({
      where: { user_sites: req.user.id, site_users: siteId },
    });

    if (!siteUser) {
      return res.notFound();
    }

    const attrs = {};
    if (req.body.buildNotificationSetting) {
      attrs.buildNotificationSetting = req.body.buildNotificationSetting;
    }
    await siteUser.update(attrs);
    const siteJSON = await siteSerializer.serialize({ id: siteUser.site_users });
    return res.json(siteJSON);
  },
});
