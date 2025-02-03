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

module.exports = {
  serializeFileStorageFile,
  serializeFileStorageService,
};
