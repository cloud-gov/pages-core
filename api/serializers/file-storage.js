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
  if (!serializable) return {};

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
  'email',
];

const serializeFileStorageUserAction = (serializable) => {
  const { User, ...rest } = serializable.dataValues;

  const { UAAIdentity } = User.dataValues;
  const { email } = UAAIdentity.dataValues;

  return pick(allowedFileStorageUserActionFields, { ...rest, email });
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
