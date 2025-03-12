const { pick } = require('../utils');

const dateFields = ['createdAt', 'updatedAt'];

const allowedFileStorageFileFields = [
  'id',
  'name',
  'description',
  'key',
  'type',
  'metadata',
  'lastModifiedAt',
  'lastModifiedBy',
  'lastModifiedByUserId',
  ...dateFields,
];

const serializeFileStorageFile = (serializable, { includeLastModified = true } = {}) => {
  if (!serializable) return {};

  let lastModified = {};

  if (includeLastModified) {
    const { FileStorageUserActions } = serializable;

    const {
      createdAt: lastModifiedAt,
      User: {
        id: lastModifiedByUserId,
        UAAIdentity: { email: lastModifiedBy },
      },
    } = FileStorageUserActions[0];

    lastModified = { lastModifiedAt, lastModifiedByUserId, lastModifiedBy };
  }

  return pick(allowedFileStorageFileFields, {
    ...serializable.dataValues,
    ...lastModified,
  });
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
  'fileKey',
  'fileName',
  'fileMetadata',
  'fileType',
];

const serializeFileStorageUserAction = (serializable) => {
  const { User, FileStorageFile, ...rest } = serializable.dataValues;

  const { UAAIdentity } = User.dataValues;
  const { email } = UAAIdentity.dataValues;

  const {
    key: fileKey,
    name: fileName,
    metadata: fileMetadata,
    type: fileType,
  } = FileStorageFile;

  return pick(allowedFileStorageUserActionFields, {
    ...rest,
    email,
    fileKey,
    fileName,
    fileMetadata,
    fileType,
  });
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
