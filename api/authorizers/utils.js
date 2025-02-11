const siteErrors = require('../responses/siteErrors');
const { Organization, Site } = require('../models');
const { fetchModelById } = require('../utils/queryDatabase');

const authorize = async (userId, siteId) => {
  const site = await fetchModelById(
    siteId,
    Site.forUser({
      id: userId,
    }),
  );

  if (!site) {
    throw {
      status: 404,
      message: siteErrors.NOT_FOUND,
    };
  }

  if (!site.isActive) {
    // if site is not active
    throw {
      status: 403,
      message: siteErrors.ORGANIZATION_INACTIVE,
    };
  }

  if (site.organizationId) {
    // if site exists in an org
    const org = await site.getOrganization();
    if (!org.isActive) {
      throw {
        status: 403,
        message: siteErrors.ORGANIZATION_INACTIVE,
      };
    }
  }

  return site;
};

const isSiteOrgManager = async (userId, siteId) => {
  const site = await authorize(userId, siteId);
  const organization = await fetchModelById(
    site.organizationId,
    Organization.forManagerRole({ id: userId }),
  );

  if (!organization) {
    throw {
      status: 403,
      message: siteErrors.ORGANIZATION_MANAGER_ACCESS,
    };
  }

  return { site, organization };
};

const isOrgManager = async (userId, orgId) => {
  const organization = await fetchModelById(
    orgId,
    Organization.forManagerRole({ id: userId }),
  );

  if (!organization) {
    throw {
      status: 403,
      message: siteErrors.ORGANIZATION_MANAGER_ACCESS,
    };
  }

  return { organization };
};

const isOrgUser = async (userId, orgId) => {
  const organization = await fetchModelById(orgId, Organization.forUser({ id: userId }));

  if (!organization) {
    throw {
      status: 403,
      message: siteErrors.ORGANIZATION_USER_ACCESS,
    };
  }

  return { organization };
};

const isSiteUser = authorize;

module.exports = { authorize, isOrgManager, isOrgUser, isSiteOrgManager, isSiteUser };
