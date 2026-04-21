const SourceCodePlatformHelper = require('../services/SourceCodePlatformHelper');
const siteErrors = require('../responses/siteErrors');
const { Organization } = require('../models');
const { authorize } = require('./utils');

const authorizeToDestroySite = (user, site) =>
  SourceCodePlatformHelper.authorizeToDestroySite(user, site);

const createWithOrgs = (organizations, organizationId) => {
  if (!organizationId) {
    throw {
      message: siteErrors.ORGANIZATION_REQUIRED,
    };
  }

  const hasOrg = organizations.find((org) => org.id === organizationId);

  if (!hasOrg) {
    throw {
      message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
      status: 404,
    };
  }

  if (!hasOrg.isActive) {
    throw {
      message: siteErrors.ORGANIZATION_INACTIVE,
      status: 403,
    };
  }
};

const createWithoutOrgs = (organizationId) => {
  if (!organizationId) return;

  throw {
    message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
    status: 404,
  };
};

const create = async (user, siteParams) => {
  const { organizationId } = siteParams;
  const organizations = await Organization.forUser(user).findAll();

  if (organizations.length === 0) {
    createWithoutOrgs(organizationId);
  }

  if (organizations.length > 0) {
    createWithOrgs(organizations, organizationId);
  }
};

const createBuild = (user, site) => authorize(user.id, site.id);

const showActions = (user, site) => authorize(user.id, site.id);

const findOne = (user, site) => authorize(user.id, site.id);

const update = (user, site) => authorize(user.id, site.id);

const destroy = (user, site) =>
  authorize(user.id, site.id).then(() => authorizeToDestroySite(user, site));

module.exports = {
  create,
  findOne,
  update,
  destroy,
  showActions,
  createBuild,
};
