const GitHub = require('./GitHub');
const { Site, User } = require('../models');
const siteErrors = require('../responses/siteErrors');
const FederalistUsersHelper = require('./FederalistUsersHelper');

const checkGithubRepository = ({ user, owner, repository }) => GitHub
  .getRepository(user, owner, repository)
  .then((repo) => {
    if (!repo) {
      throw {
        message: `The repository ${owner}/${repository} does not exist.`,
        status: 400,
      };
    }
    if (!repo.permissions || !repo.permissions.push) {
      return FederalistUsersHelper.federalistUsersAdmins(user.githubAccessToken)
        .then((admins) => {
          if (!admins.includes(user.username)) {
            throw {
              message: siteErrors.WRITE_ACCESS_REQUIRED,
              status: 400,
            };
          }
        })
        .catch(() => {
          throw {
            message: siteErrors.WRITE_ACCESS_REQUIRED,
            status: 400,
          };
        });
    }
    return true;
  });

const paramsForExistingSite = siteParams => ({
  owner: siteParams.owner ? siteParams.owner.toLowerCase() : null,
  repository: siteParams.repository ? siteParams.repository.toLowerCase() : null,
});

const throwExistingSiteErrors = ({ site, user }) => {
  if (!site) {
    const error = new Error('The site you are trying to add does not exist');
    error.status = 404;
    throw error;
  }

  const existingUser = site.Users.find(candidate => candidate.id === user.id);
  if (existingUser) {
    const error = new Error("You've already added this site to Federalist");
    error.status = 400;
    throw error;
  }

  return checkGithubRepository({ user, owner: site.owner, repository: site.repository });
};

const createSiteMembership = ({ user, siteParams }) => {
  let site;

  return Site.findOne({ where: paramsForExistingSite(siteParams), include: [User] })
    .then((fetchedSite) => {
      site = fetchedSite;
      return throwExistingSiteErrors({ site, user });
    }).then(() => site.addUser(user)).then(() => site);
};

const revokeSiteMembership = ({ user, site, userId }) => GitHub
  .checkPermissions(user, site.owner, site.repository)
  .then((permissions) => {
    if (user.id !== Number(userId) && !permissions.admin) {
      throw {
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 400,
      };
    }
  })
  .then(() => {
    const userToRemove = site.Users.find(u => u.id === Number(userId));

    if (!userToRemove) {
      throw {
        message: siteErrors.NO_ASSOCIATED_USER,
        status: 404,
      };
    }

    if (userToRemove.username.toLowerCase() === site.owner.toLowerCase()) {
      throw {
        message: siteErrors.OWNER_REMOVE,
        status: 400,
      };
    }

    return site.removeUser(userToRemove);
  });

module.exports = { createSiteMembership, revokeSiteMembership };
