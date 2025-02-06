const { pick } = require('../utils');

const dateFields = ['createdAt', 'updatedAt'];

const allowedFileStorageFileFields = [
  'id',
  'name',
  'description',
  'key',
  'type',
  'metadata',
  ...dateFields,
];

const serializeFileStorageFile = (serializable) => {
  return pick(allowedFileStorageFileFields, serializable.dataValues);
};

const serializeFileStorageFiles = (list) => {
  return list.map((i) => serializeFileStorageFile(i));
};

const allowedFileStorageServiceFields = [
  'id',
  'organizationId',
  'siteId',
  'metadata',
  ...dateFields,
];

const serializeFileStorageService = (serializable) => {
  return pick(allowedFileStorageServiceFields, serializable.dataValues);
};

const allowedFileStorageUserActionFields = [
  'id',
  'fileStorageServiceId',
  'fileStorageFileId',
  'method',
  'description',
  'userId',
  'createdAt',
];

const serializeFileStorageUserAction = (serializable) => {
  return pick(allowedFileStorageUserActionFields, serializable.dataValues);
};

const serializeFileStorageUserActions = (list) => {
  return list.map((i) => serializeFileStorageUserAction(i));
};

module.exports = {
  serializeFileStorageFile,
  serializeFileStorageFiles,
  serializeFileStorageService,
  serializeFileStorageUserAction,
  serializeFileStorageUserActions,
};
