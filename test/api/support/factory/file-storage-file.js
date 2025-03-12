const path = require('node:path');
const fileStorageService = require('./file-storage-service');
const userWithIdentity = require('./user-with-uaa-identity');
const { FileStorageFile, FileStorageUserAction } = require('../../../../api/models');
const { getRandItem } = require('./utils');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${counters[key]}`;
}

async function build(params = {}) {
  let {
    name,
    key,
    type,
    fileStorageServiceId = null,
    description = null,
    metadata = null,
    createFileUserAction = true,
  } = params;

  if (!name) {
    name = increment('file-storage-service');
  }

  if (!key) {
    key = increment('/key/path/');
  }

  if (!type) {
    type = 'file/plain';
  }

  if (!fileStorageServiceId) {
    const fss = await fileStorageService.create();
    fileStorageServiceId = fss.id;
  }

  const file = await FileStorageFile.create({
    name,
    key,
    type,
    fileStorageServiceId,
    description,
    metadata,
  });

  const { user } = await userWithIdentity.create();

  if (createFileUserAction) {
    await FileStorageUserAction.create({
      userId: user.id,
      fileStorageServiceId,
      fileStorageFileId: file.id,
      method: getRandItem(FileStorageUserAction.METHODS),
      description: getRandItem(FileStorageUserAction.ACTION_TYPES),
    });
  }

  return file;
}

function create(params) {
  return build(params);
}

async function truncate() {
  await FileStorageFile.truncate({
    force: true,
    cascade: true,
  });

  await userWithIdentity.truncate();
}

async function createBulk(
  fileStorageServiceId,
  directoryPath,
  { files = 0, directories = 0 } = {},
) {
  let totalFiles = [];
  let totalDiectories = [];
  if (files > 0) {
    const fileList = new Array(files).fill(0);

    await Promise.all(
      fileList.map(async (_, idx) => {
        const fileName = `file-${idx}.txt`;
        const key = path.join(directoryPath, fileName);
        const row = await create({ fileStorageServiceId, key });

        totalFiles.push(row);
      }),
    );
  }

  if (directories > 0) {
    const fileList = new Array(directories).fill(0);

    await Promise.all(
      fileList.map(async (_, idx) => {
        const directoryName = `dir-${idx}/`;
        const key = path.join(directoryPath, directoryName);
        const row = await create({ fileStorageServiceId, key, type: 'directory' });

        totalDiectories.push(row);
      }),
    );
  }

  return {
    files: totalFiles,
    directories: totalDiectories,
  };
}

module.exports = {
  build,
  create,
  truncate,
  createBulk,
};
