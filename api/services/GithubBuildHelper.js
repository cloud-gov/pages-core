const url = require('url');
const GitHub = require('./GitHub');
const config = require('../../config');
const { buildViewLink } = require('../utils/build');
const EventCreator = require('./EventCreator');
const { Event } = require('../models');

// Loops through supplied list of users, until it
// finds a user with a valid access token
const getAccessTokenWithPushPermissions = async (site, siteUsers) => {
  let count = 0;
  const users = siteUsers.filter(u => u.githubAccessToken && u.signedInAt)
    .sort((a, b) => b.signedInAt - a.signedInAt);

  const getNextToken = async (user) => {
    try {
      if (!user) {
        return null;
      }

      const permissions = await GitHub.checkPermissions(user, site.owner, site.repository);

      if (permissions.push) {
        return user.githubAccessToken;
      }
      count += 1;
      return getNextToken(users[count]);
    } catch (err) {
      count += 1;
      return getNextToken(users[count]);
    }
  };

  return getNextToken(users[count]);
};

const loadBuildUserAccessToken = async (build) => {
  let githubAccessToken;
  const site = build.Site;
  const users = site.Users;
  const buildUser = users.find(u => u.id === build.user);
  if (buildUser) {
    githubAccessToken = await getAccessTokenWithPushPermissions(site, [buildUser]);
  }
  if (!githubAccessToken) {
    /**
     * an anonymous user (i.e. not through federalist) has pushed
     * an update, we need to find a valid GitHub access token among the
     * site's current users with which to report the build's status
    */
    githubAccessToken = await getAccessTokenWithPushPermissions(site, users);
  }

  if (!githubAccessToken) {
    throw new Error(`Unable to find valid access token to report build@id=${build.id} status`);
  }
  return githubAccessToken;
};

const reportBuildStatus = async (build) => {
  const sha = build.clonedCommitSha || build.requestedCommitSha;
  if (!sha) {
    throw new Error('Build or commit sha undefined. Unable to report build status');
  }

  const accessToken = await loadBuildUserAccessToken(build);

  const context = config.app.app_env === 'production'
    ? 'federalist/build' : `federalist-${config.app.app_env}/build`;

  const site = build.Site;

  const options = {
    owner: site.owner,
    repo: site.repository,
    sha,
    context,
  };

  if (build.isInProgress()) {
    options.state = 'pending';
    options.target_url = url.resolve(config.app.hostname, `/sites/${site.id}/builds/${build.id}/logs`);
    options.description = 'The build is running.';
  } else if (build.state === 'success') {
    options.state = 'success';
    options.target_url = buildViewLink(build, site);
    options.description = 'The build is complete!';
  } else if (build.state === 'error') {
    options.state = 'error';
    options.target_url = url.resolve(config.app.hostname, `/sites/${site.id}/builds/${build.id}/logs`);
    options.description = 'The build has encountered an error.';
  }
  return GitHub.sendCreateGithubStatusRequest(accessToken, options);
};

const fetchContent = async (build, path) => {
  if (!build.clonedCommitSha) {
    throw new Error(`Build or commit sha undefined. Unable to fetch ${path} for build@id=${build.id}`);
  }

  const accessToken = await loadBuildUserAccessToken(build);
  const { owner, repository } = build.Site;
  return GitHub.getContent(accessToken, owner, repository, path, build.clonedCommitSha)
    .catch((err) => {
      EventCreator.warn(Event.labels.BUILD_STATUS, err.message, {
        buildId: build.id,
        path,
        commitSha: build.clonedCommitSha,
        error: err.stack,
      });
    });
};

module.exports = { reportBuildStatus, fetchContent, loadBuildUserAccessToken };
