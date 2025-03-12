const { isEmpty } = require('underscore');
const EventCreator = require('../services/EventCreator');
const {
  canCreateSiteStorage,
  isFileStorageUser,
  isFileStorageManager,
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
    const { site } = await canCreateSiteStorage(user.id, siteId);

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
  },

  async createDirectory(req, res) {
    const {
      body: { parent, name },
      params,
      user,
    } = req;

    const fssId = parseInt(params.file_storage_id, 10);
    const { fileStorageService } = await isFileStorageUser(user.id, fssId);

    const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
    const client = await siteStorageService.createClient();
    const fss = await client.createDirectory(parent, name);

    const data = serializeFileStorageFile(fss, { includeLastModified: false });
    return res.send(data);
  },

  async deleteFile(req, res) {
    const { params, user } = req;

    const fssId = parseInt(params.file_storage_id, 10);
    const fileId = parseInt(params.file_id, 10);
    const { fileStorageService } = await isFileStorageUser(user.id, fssId);

    const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
    const client = await siteStorageService.createClient();
    const results = await client.deleteFile(fileId);

    if (!results) {
      return res.notFound();
    }

    return res.send(results);
  },

  async getFile(req, res) {
    const { params, user } = req;

    const fssId = parseInt(params.file_storage_id, 10);
    const fileId = parseInt(params.file_id, 10);

    const { fileStorageService } = await isFileStorageUser(user.id, fssId);

    const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
    const client = await siteStorageService.createClient();
    const results = await client.getFile(fileId);

    if (isEmpty(results)) {
      return res.notFound();
    }

    return res.send(results);
  },

  async listDirectoryFiles(req, res) {
    const { params, query, user } = req;
    const {
      path = '',
      limit = 50,
      page = 1,
      sortKey = 'updatedAt',
      sortOrder = 'DESC',
    } = query;
    const order = [[sortKey, sortOrder]];

    const fssId = parseInt(params.file_storage_id, 10);
    const { fileStorageService } = await isFileStorageUser(user.id, fssId);

    const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
    const client = await siteStorageService.createClient();
    const results = await client.listDirectoryFiles(path, { limit, page, order });

    return res.send(results);
  },

  async listUserActions(req, res) {
    const { params, query, user } = req;
    const { limit = 50, page = 1 } = query;

    const fssId = parseInt(params.file_storage_id, 10);
    const fileStorageFileId = params.file_id && parseInt(params.file_id, 10);

    const { fileStorageService } = await isFileStorageManager(user.id, fssId);

    const siteStorageService = new SiteFileStorageSerivce(fileStorageService, user.id);
    const client = await siteStorageService.createClient();
    const results = await client.listUserActions({
      fileStorageFileId,
      limit,
      page,
    });

    return res.send(results);
  },

  async uploadFile(req, res) {
    const { params, user } = req;

    const fssId = parseInt(params.file_storage_id, 10);

    const { fileStorageService } = await isFileStorageUser(user.id, fssId);

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

    const data = serializeFileStorageFile(fss, { includeLastModified: false });
    return res.send(data);
  },
});
