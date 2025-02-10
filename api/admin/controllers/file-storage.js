const EventCreator = require('../../services/EventCreator');
const { canAdminCreateSiteFileStorage } = require('../../authorizers/file-storage');
const { serializeFileStorageService } = require('../../serializers/file-storage');
const { wrapHandlers } = require('../../utils');
const { Event } = require('../../models');
const { adminCreateSiteFileStorage } = require('../../services/file-storage');

module.exports = wrapHandlers({
  async createSiteFileStorage(req, res) {
    const { params, user } = req;

    const siteId = parseInt(params.id, 10);
    const { site } = await canAdminCreateSiteFileStorage(siteId);

    const fss = await adminCreateSiteFileStorage(site);

    EventCreator.audit(
      Event.labels.ADMIN,
      user,
      'Site File Storage Service Created',
      fss,
    );

    const data = serializeFileStorageService(fss);
    return res.send(data);
  },
});
