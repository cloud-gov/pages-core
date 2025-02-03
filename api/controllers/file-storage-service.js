const EventCreator = require('../services/EventCreator');
const {
  canCreateSiteStorage,
  isFileStorageUser,
} = require('../authorizers/file-storage');
const {
  serializeFileStorageService,
  serializeFileStorageFile,
} = require('../serializers/file-storage');
const { wrapHandlers } = require('../utils');
const { Event } = require('../models');
const { SiteFileStorageSerivce } = require('../services/file-storage');

module.exports = wrapHandlers({
  async create(req, res) {
    const { params, user } = req;
    const siteId = parseInt(params.site_id, 10);

    try {
      const { site } = await canCreateSiteStorage({ id: user.id }, { id: siteId });

      const siteStorageService = new SiteFileStorageSerivce(site, user.id);
      const client = await siteStorageService.createClient();
      const fss = await client.createFileStorageService();

      EventCreator.audit(
        Event.labels.ORG_MANAGER_ACTION,
        user,
        'Site File Storage Service Created',
        fss,
      );

      const data = serializeFileStorageService(fss);
      return res.send(data);
    } catch (error) {
      return res.status(error.status).send(error);
    }
  },

  async createDirectory(req, res) {
    const {
      body: { parent, name },
      params,
      user,
    } = req;

    const fssId = parseInt(params.file_storage_id, 10);

    try {
      const { fileStorageService } = await isFileStorageUser(
        { id: user.id },
        { id: fssId },
      );

      const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
      const client = await siteStorageService.createClient();
      const fss = await client.createDirectory(parent, name);

      const data = serializeFileStorageFile(fss);
      return res.send(data);
    } catch (error) {
      return res.status(error.status).send(error);
    }
  },
});
