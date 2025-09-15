const EventCreator = require('../../services/EventCreator');
const { canAdminCreateSiteFileStorage } = require('../../authorizers/file-storage');
const { serializeFileStorageService } = require('../../serializers/file-storage');
const { wrapHandlers } = require('../../utils');
const { Event } = require('../../models');
const {
  adminCreateSiteFileStorage,
  adminGetSiteFileStorageBySiteId,
  adminGetSiteFileStorageById,
  adminGetSiteFileStorageUserActions,
} = require('../../services/file-storage');
const siteErrors = require('../../responses/siteErrors');

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
  async getSiteFileStorage(req, res) {
    const { params } = req;

    const siteId = parseInt(params.id, 10);

    const fss = await adminGetSiteFileStorageBySiteId(siteId);

    if (!fss) {
      throw {
        status: 404,
        message: siteErrors.SITE_FILE_STORAGE_DOES_NOT_EXIST,
      };
    }

    const data = serializeFileStorageService(fss);

    return res.send(data);
  },
  async getSiteFileStorageUserActions(req, res) {
    const { params, query } = req;
    const { limit = 50, page = 1 } = query;

    const siteFileStorageId = parseInt(params.id, 10);

    const fss = await adminGetSiteFileStorageById(siteFileStorageId);

    if (!fss) {
      throw {
        status: 404,
        message: siteErrors.SITE_FILE_STORAGE_DOES_NOT_EXIST,
      };
    }

    const userActions = await adminGetSiteFileStorageUserActions({
      siteFileStorageId,
      limit,
      page,
    });

    return res.send(userActions);
  },
});
