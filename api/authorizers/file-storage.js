const siteErrors = require('../responses/siteErrors');
const { FileStorageService, Site } = require('../models');
const { isSiteOrgManager, isOrgManager, isOrgUser } = require('./utils');

const canCreateSiteStorage = async ({ id: userId }, { id: siteId }) => {
  const { site, organization } = await isSiteOrgManager({ id: userId }, { id: siteId });

  const fss = await FileStorageService.findOne({ where: { siteId } });

  if (fss) {
    throw {
      status: 403,
      message: siteErrors.SITE_FILE_STORAGE_EXISTS,
    };
  }

  return { site, organization };
};

const canAdminCreateSiteFileStorage = async ({ id: siteId }) => {
  const site = await Site.findByPk(siteId);

  if (!site) {
    throw {
      status: 403,
      message: siteErrors.SITE_DOES_NOT_EXIST,
    };
  }

  const fss = await FileStorageService.findOne({ where: { siteId } });

  if (fss) {
    throw {
      status: 403,
      message: siteErrors.SITE_FILE_STORAGE_EXISTS,
    };
  }

  return { site };
};

async function hasFileStorage(fssId) {
  const fileStorageService = await FileStorageService.findByPk(fssId);

  if (!fileStorageService) {
    throw {
      status: 404,
      message: siteErrors.NOT_FOUND,
    };
  }

  return { fileStorageService };
}

async function isFileStorageManager({ id: userId }, { id: fssId }) {
  const { fileStorageService } = await hasFileStorage(fssId);

  const { organization } = await isOrgManager(
    { id: userId },
    { id: fileStorageService.organizationId },
  );

  return { organization, fileStorageService };
}

async function isFileStorageUser({ id: userId }, { id: fssId }) {
  const { fileStorageService } = await hasFileStorage(fssId);

  const { organization } = await isOrgUser(
    { id: userId },
    { id: fileStorageService.organizationId },
  );

  return { fileStorageService, organization };
}

module.exports = {
  canAdminCreateSiteFileStorage,
  canCreateSiteStorage,
  isFileStorageManager,
  isFileStorageUser,
};
