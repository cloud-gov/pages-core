const siteErrors = require('../responses/siteErrors');
const { FileStorageService, Site } = require('../models');
const { isSiteOrgManager, isOrgManager, isOrgUser } = require('./utils');

const canCreateSiteStorage = async (userId, siteId) => {
  const { site, organization } = await isSiteOrgManager(userId, siteId);

  const fss = await FileStorageService.findOne({ where: { siteId } });

  if (fss) {
    throw {
      status: 403,
      message: siteErrors.SITE_FILE_STORAGE_EXISTS,
    };
  }

  return { site, organization };
};

const canAdminCreateSiteFileStorage = async (siteId) => {
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

async function isFileStorageManager(userId, fssId) {
  const { fileStorageService } = await hasFileStorage(fssId);

  const { organization } = await isOrgManager(userId, fileStorageService.organizationId);

  return { organization, fileStorageService };
}

async function isFileStorageUser(userId, fssId) {
  const { fileStorageService } = await hasFileStorage(fssId);

  const { organization } = await isOrgUser(userId, fileStorageService.organizationId);

  return { fileStorageService, organization };
}

module.exports = {
  canAdminCreateSiteFileStorage,
  canCreateSiteStorage,
  isFileStorageManager,
  isFileStorageUser,
};
