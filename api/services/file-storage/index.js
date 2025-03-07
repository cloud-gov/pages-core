const path = require('node:path');
const { Op } = require('sequelize');
const {
  FileStorageService,
  FileStorageFile,
  FileStorageUserAction,
} = require('../../models');
const S3Helper = require('../S3Helper');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');
const { normalizeDirectoryPath, paginate, slugify } = require('../../utils');
const {
  serializeFileStorageFile,
  serializeFileStorageFiles,
  serializeFileStorageUserActions,
} = require('../../serializers/file-storage');
const siteErrors = require('../../responses/siteErrors');

const apiClient = new CloudFoundryAPIClient();

async function adminCreateSiteFileStorage(
  { id: siteId, s3ServiceName, organizationId },
  root = '~assets/',
) {
  const serviceInstance = await apiClient.fetchServiceInstance(s3ServiceName);

  const { access_key_id, bucket, region, secret_access_key } =
    await apiClient.fetchServiceInstanceCredentials(s3ServiceName);

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id,
    secretAccessKey: secret_access_key,
    bucket,
    region,
  });

  await s3Client.putObject('', root);

  const fss = await FileStorageService.create({
    siteId,
    organizationId,
    name: 'site-storage',
    serviceId: serviceInstance.guid,
    serviceName: serviceInstance.name,
  });

  return fss;
}

class SiteFileStorageSerivce {
  constructor(fileStorageService, userId) {
    const { id, organizationId, serviceName, serviceId } = fileStorageService.dataValues;

    this.S3_BASE_PATH = '~assets/';
    this.id = id;
    this.organizationId = organizationId;
    this.serviceName = serviceName;
    this.serviceId = serviceId;

    this.access_key_id = null;
    this.bucket = null;
    this.region = null;
    this.secret_access_key = null;
    this.serviceInstance = null;
    this.s3Client = null;
    this.userId = userId;

    this.initialized = null;
  }

  async createClient() {
    const serviceInstance = await apiClient.fetchServiceInstance(this.serviceName);

    this.serviceInstance = serviceInstance;

    const { access_key_id, bucket, region, secret_access_key } =
      await apiClient.fetchServiceInstanceCredentials(this.serviceName);

    this.access_key_id = access_key_id;
    this.bucket = bucket;
    this.region = region;
    this.secret_access_key = secret_access_key;

    const s3Client = new S3Helper.S3Client({
      accessKeyId: access_key_id,
      secretAccessKey: secret_access_key,
      bucket,
      region,
    });

    this.s3Client = s3Client;
    this.initialized = true;

    return this;
  }

  async createAssetRoot() {
    this.#isInitialized();

    return this.s3Client.putObject('', this.S3_BASE_PATH);
  }

  async createDirectory(parent, name) {
    const directoryName = slugify(name);
    const directoryPath = this.#buildKeyPath(`${parent}/${directoryName}`);

    await this.#hasDuplicateKey(directoryPath, 'directory');

    await this.s3Client.putObject('', directoryPath);

    const fsf = await FileStorageFile.create({
      name,
      key: directoryPath,
      type: 'directory',
      fileStorageServiceId: this.id,
      description: 'directory',
    });

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.id,
      fileStorageFileId: fsf.id,
      method: FileStorageUserAction.METHODS.POST,
      description: FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
    });

    return fsf;
  }

  async createFileStorageService() {
    this.#isInitialized();

    await this.createAssetRoot();

    const fss = await FileStorageService.create({
      siteId: this.id,
      organizationId: this.organizationId,
      name: 'site-storage',
      serviceId: this.serviceInstance.guid,
      serviceName: this.serviceInstance.name,
    });

    this.id = fss.id;

    return fss;
  }

  async deleteFile(id) {
    const record = await FileStorageFile.findOne({
      where: { id, fileStorageServiceId: this.id },
    });

    if (!record) {
      return null;
    }

    if (record.type === 'directory') {
      const children = await FileStorageFile.count({
        where: {
          fileStorageServiceId: this.id,
          key: { [Op.like]: `${record.key}%` },
        },
      });

      if (children > 1) {
        const error = new Error(siteErrors.DIRECTORY_MUST_BE_EMPTIED);
        error.status = 400;
        throw error;
      }
    }

    await this.s3Client.deleteObject(record.key);

    const result = await record.destroy();

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.id,
      fileStorageFileId: id,
      method: FileStorageUserAction.METHODS.DELETE,
      description: FileStorageUserAction.ACTION_TYPES.DELETE_FILE,
    });

    return result;
  }

  async getFile(id) {
    const record = await FileStorageFile.scope(['withLastAction']).findOne({
      where: { id, fileStorageServiceId: this.id },
    });

    return serializeFileStorageFile(record);
  }

  async listUserActions({ fileStorageFileId = null, limit = 50, page = 1 } = {}) {
    const order = [['createdAt', 'DESC']];

    const where = {
      fileStorageServiceId: this.id,
      ...(fileStorageFileId && { fileStorageFileId }),
    };

    const results = await paginate(
      FileStorageUserAction.scope(['withUserIdentity']),
      serializeFileStorageUserActions,
      {
        limit,
        page,
      },
      {
        where,
        order,
      },
    );

    return results;
  }

  async listDirectoryFiles(
    directory,
    { limit = 50, page = 1, order = [['name', 'ASC']] } = {},
  ) {
    const key = this.#buildKeyPath(directory);

    const results = await paginate(
      FileStorageFile.scope(['withLastAction']),
      serializeFileStorageFiles,
      {
        limit,
        page,
      },
      {
        where: {
          fileStorageServiceId: this.id,
          [Op.and]: [
            { key: { [Op.like]: `${key}%` } },
            { key: { [Op.notLike]: `${key}%/_%` } },
            { key: { [Op.ne]: key } },
          ],
        },
        order,
      },
    );

    return results;
  }

  async uploadFile(name, fileBuffer, type, parent, metadata = {}) {
    const filename = slugify(name);
    const directoryPath = this.#buildKeyPath(parent);
    const key = path.join(directoryPath, filename);

    await this.#hasDuplicateKey(key, 'file');

    await this.s3Client.putObject(fileBuffer, key);

    const fsf = await FileStorageFile.create({
      name,
      key,
      type: type,
      metadata,
      fileStorageServiceId: this.id,
    });

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.id,
      fileStorageFileId: fsf.id,
      method: FileStorageUserAction.METHODS.POST,
      description: FileStorageUserAction.ACTION_TYPES.UPLOAD_FILE,
    });

    return fsf;
  }

  #buildKeyPath(keyPath) {
    const normalized = normalizeDirectoryPath(keyPath);
    const root = normalized.split('/').filter((x) => x)[0];

    if (`${root}/` !== this.S3_BASE_PATH) {
      return path.join(this.S3_BASE_PATH, normalized);
    }

    return normalized;
  }

  async #hasDuplicateKey(key, type) {
    let errorMessage;

    switch (type) {
      case 'directory':
        errorMessage = siteErrors.DIRECTORY_EXISTS_ALREADY;
        break;
      case 'file':
        errorMessage = siteErrors.FILE_EXISTS_ALREADY;
        break;
      default:
        errorMessage = 'An error occured';
        break;
    }

    const fsf = await FileStorageFile.findOne({
      where: { fileStorageServiceId: this.id, key },
    });

    if (fsf) {
      const error = new Error(errorMessage);
      error.status = 400;

      throw error;
    }
  }

  #isInitialized() {
    if (!this.initialized) {
      throw Error('Initialize the class instance with `await instance.createClient()`');
    }
  }
}

module.exports = {
  adminCreateSiteFileStorage,
  SiteFileStorageSerivce,
};
