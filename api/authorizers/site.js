const GitHub = require('../services/GitHub');
const siteErrors = require('../responses/siteErrors');
const { Organization, Site, User } = require('../models');
const FederalistUsersHelper = require('../services/FederalistUsersHelper');

const authorize = ({ id }, site) => (
  User.findByPk(id, { include: [Site] })
    .then((user) => {
      const hasSite = user.Sites.some(s => site.id === s.id);
      if (hasSite) {
        return site.id;
      }

      throw 403;
    })
);

const authorizeAdmin = (user, site) => (
  GitHub.checkPermissions(user, site.owner, site.repository)
    .then((permissions) => {
      if (!permissions.admin) {
        throw {
          message: siteErrors.ADMIN_ACCESS_REQUIRED,
          status: 403,
        };
      }
      return site.id;
    })
    .catch((error) => {
      if (error.status === 404) {
      // authorize user if the site's repo does not exist:
      // When a user attempts to delete a site after deleting the repo, Federalist
      // attempts to fetch the repo but it no longer exists and receives a 404
        return site.id;
      }
      throw {
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 403,
      };
    })
);

function authorizeFederalistUsersAdmin(user) {
  return FederalistUsersHelper.federalistUsersAdmins(user.githubAccessToken)
    .then((admins) => {
      if (!admins.includes(user.username)) {
        throw 'user is not a system operator';
      }
    })
    .catch(() => {
      throw {
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 403,
      };
    });
}

// create is allowed for all
const create = async (user, siteParams) => {
  const { organizationId } = siteParams;
  const organizations = await Organization.forUser(user).findAll();

  if (organizations.length === 0 && !organizationId) return;

  if (organizations.length === 0 && organizationId) {
    throw {
      message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
      status: 404,
    };
  }

  if (organizations.length > 0 && !organizationId) {
    throw {
      message: siteErrors.ORGANIZATION_REQUIRED,
    };
  }

  const hasOrg = organizations.find(org => org.id === organizationId);

  if (organizations.length > 0 && !hasOrg) {
    throw {
      message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
      status: 404,
    };
  }
};

const addUser = () => Promise.resolve();

const createBuild = (user, site) => authorize(user, site);

const showActions = (user, site) => authorize(user, site);

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) => authorize(user, site)
  .then(() => authorizeAdmin(user, site))
  .catch(() => authorizeFederalistUsersAdmin(user));

const removeUser = (user, site) => authorize(user, site);

module.exports = {
  create,
  findOne,
  update,
  destroy,
  addUser,
  removeUser,
  showActions,
  createBuild,
};
