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
const badRequest = require('../responses/badRequest');

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

  async listDirectoryFiles(req, res) {
    const { params, query, user } = req;
    const {
      path = '~assets/',
      limit = 50,
      page = 1,
      sortKey = 'updatedAt',
      sortOrder = 'DESC',
    } = query;
    const order = [sortKey, sortOrder];

    const fssId = parseInt(params.file_storage_id, 10);

    try {
      const { fileStorageService } = await isFileStorageUser(
        { id: user.id },
        { id: fssId },
      );

      const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
      const client = await siteStorageService.createClient();
      const results = await client.listDirectoryFiles(path, { limit, page, order });

      res.send(results);
    } catch (error) {
      return res.status(error.status).send(error);
    }
  },

  async uploadFile(req, res) {
    const { params, user } = req;

    const fssId = parseInt(params.file_storage_id, 10);

    try {
      const { fileStorageService } = await isFileStorageUser(
        { id: user.id },
        { id: fssId },
      );

      const [file] = req.files;

      if (!file) {
        const err = new Error('No file uploaded.');
        return badRequest(err, { res });
      }

      const { name, parent } = req.body;

      if (!name || !parent) {
        const err = new Error('No file name or parent directory defined.');
        return badRequest(err, { res });
      }

      const { buffer: fileBuffer, originalname, encoding, mimetype, size } = file;

      const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
      const client = await siteStorageService.createClient();
      const fss = await client.uploadFile(name, fileBuffer, mimetype, parent, {
        encoding,
        size,
        originalname,
      });

      const data = serializeFileStorageFile(fss);
      return res.send(data);
    } catch (error) {
      return res.status(error.status).send(error);
    }
  },
});
