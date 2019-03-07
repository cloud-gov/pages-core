const { logger } = require('../../winston');
const url = require('url');
const Sequelize = require('sequelize');
const GitHub = require('./GitHub');
const config = require('../../config');

const { Build, Site, User } = require('../models');

// Loops through supplied list of users, until it
// finds a user with a valid access token
const checkAccessTokenPermissions = (users, site) => {
  let count = 0;

  const getNextToken = (user) => {
    if (!user) {
      return Promise.resolve(null);
    }

    return GitHub.checkPermissions(user, site.owner, site.repository)
    .then((permissions) => {
      if (permissions.admin) {
        return Promise.resolve(user.githubAccessToken);
      }

      count += 1;

      return getNextToken(users[count]);
    });
  };

  return getNextToken(users[count]);
};

const loadSiteUserAccessToken = site =>
  site.getUsers({
    where: {
      githubAccessToken: { [Sequelize.Op.ne]: null },
      signedInAt: { [Sequelize.Op.ne]: null },
    },
    order: [['signedInAt', 'DESC']],
  }).then(users =>
    checkAccessTokenPermissions(users, site)
    .then((githubAccessToken) => {
      if (githubAccessToken) {
        return githubAccessToken;
      }

      throw new Error('Unable to find valid access token to report build status');
    })
  );


const loadBuildUserAccessToken = build =>
  Build.findByPk(build.id, { include: [Site, User] })
  .then((foundBuild) => {
    const user = foundBuild.User;

    if (user.githubAccessToken) {
      return user.githubAccessToken;
    }

    /**
     * an anonymous user (i.e. not through federalist) has pushed
     * an update, we need to find a valid GitHub access token among the
     * site's current users with which to report the build's status
    */
    return loadSiteUserAccessToken(foundBuild.Site);
  });

const reportBuildStatus = (build) => {
  let site;

  return new Promise((resolve, reject) => {
    if (!build || !build.commitSha) {
      reject(new Error('Build or commit sha undefined. Unable to report build status'));
    } else {
      resolve();
    }
  })
  .then(() => Site.findByPk(build.site))
  .then((model) => {
    if (!model) {
      throw new Error('Unable to find a site for the given build');
    }
    site = model;

    return loadBuildUserAccessToken(build);
  }).then((accessToken) => {
    const context = config.app.app_env === 'production'
      ? 'federalist/build' : `federalist-${config.app.app_env}/build`;

    const options = {
      owner: site.owner,
      repo: site.repository,
      sha: build.commitSha,
      context,
    };

    if (build.state === 'processing') {
      options.state = 'pending';
      options.target_url = url.resolve(config.app.hostname, `/sites/${site.id}/builds/${build.id}/logs`);
      options.description = 'The build is running.';
    } else if (build.state === 'success') {
      options.state = 'success';
      options.target_url = site.viewLinkForBranch(build.branch);
      options.description = 'The build is complete!';
    } else if (build.state === 'error') {
      options.state = 'error';
      options.target_url = url.resolve(config.app.hostname, `/sites/${site.id}/builds/${build.id}/logs`);
      options.description = 'The build has encountered an error.';
    }
    return GitHub.sendCreateGithubStatusRequest(accessToken, options);
  })
  .catch((error) => {
    logger.error('Error reporting build status to GitHub: ', error);
  });
};


module.exports = { reportBuildStatus };
