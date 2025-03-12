const fileStorageFile = require('./file-storage-file');
const fileStorageService = require('./file-storage-service');
const user = require('./user');
const uaaIdentity = require('./uaa-identity');
const { FileStorageUserAction } = require('../../../../api/models');
const { getRandItem } = require('./utils');

async function build(params = {}) {
  let {
    method = null,
    description = null,
    fileStorageServiceId = null,
    fileStorageFileId = null,
    userId = null,
  } = params;

  if (!userId) {
    const u = await user();
    userId = u.id;
  }

  if (!fileStorageFileId) {
    const fss = await fileStorageFile.create();
    fileStorageFileId = fss.id;
  }

  if (!fileStorageServiceId) {
    const fss = await fileStorageService.create();
    fileStorageServiceId = fss.id;
  }

  if (!method) {
    method = getRandItem(FileStorageUserAction.METHODS);
  }

  if (!description) {
    description = getRandItem(FileStorageUserAction.ACTION_TYPES);
  }

  return FileStorageUserAction.create({
    fileStorageServiceId,
    fileStorageFileId,
    userId,
    method,
    description,
  });
}

function create(params) {
  return build(params);
}

function truncate() {
  return FileStorageUserAction.truncate({
    force: true,
    cascade: true,
  });
}

async function createBulk(
  { fileStorageServiceId, fileStorageFileId, userId },
  actions = 1,
) {
  const actionslist = new Array(actions).fill(0);

  return Promise.all(
    actionslist.map(async () => {
      return create({ fileStorageServiceId, fileStorageFileId, userId });
    }),
  );
}

async function createBulkRandom({ fileStorageServiceId }, actions = 1) {
  const fsf = await fileStorageFile.create({
    fileStorageServiceId,
    createFileUserAction: false,
  });
  const u = await user();
  await uaaIdentity.createUAAIdentity({ userId: u.id });

  return createBulk(
    { fileStorageServiceId, fileStorageFileId: fsf.id, userId: u.id },
    actions,
  );
}

module.exports = {
  build,
  create,
  truncate,
  createBulk,
  createBulkRandom,
};
