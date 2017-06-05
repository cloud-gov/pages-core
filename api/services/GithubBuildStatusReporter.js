const Github = require('github');
const logger = require('winston');
const url = require('url');
const config = require('../../config');

const environment = require('../../services/environment');
const { Build, Site, User } = require('../models');

const loadSiteUserAccessToken = site => site.getUsers({
  where: {
    githubAccessToken: { $ne: null },
    signedInAt: { $ne: null },
  },
  order: [['signedInAt', 'DESC']],
  limit: 1,
}).then((users) => {
  const user = users[0];
  if (user && user.githubAccessToken) {
    return user.githubAccessToken;
  }
  throw new Error('Unable to find valid access token to report build status');
});


const loadBuildUserAccessToken = build => Build.findById(build.id, { include: [Site, User] })
  .then((foundBuild) => {
    const user = foundBuild.User;

    if (user.githubAccessToken) {
      return user.githubAccessToken;
    }
    return loadSiteUserAccessToken(foundBuild.Site);
  });


const authenticateGithubClient = (accessToken) => {
  const client = new Github({ version: '3.0.0' });
  client.authenticate({
    type: 'oauth',
    token: accessToken,
  });
  return client;
};


const sendCreateGithubStatusRequest = (githubClient, options) => new Promise((resolve, reject) => {
  githubClient.statuses.create(options, (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res);
    }
  });
});


const reportBuildStatus = (build) => {
  let site;

  return new Promise((resolve, reject) => {
    if (!build || !build.commitSha) {
      reject(new Error('Build or commit sha undefined. Unable to report build status'));
    } else {
      resolve();
    }
  }).then(() => Site.findById(build.site)).then((model) => {
    if (!model) {
      throw new Error('Unable to find a site for the given build');
    }
    site = model;
    return loadBuildUserAccessToken(build);
  }).then((accessToken) => {
    const githubClient = authenticateGithubClient(accessToken);

    const context = environment.env === 'production'
      ? 'federalist/build' : `federalist-${environment.env}/build`;

    const options = {
      user: site.owner,
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
    return sendCreateGithubStatusRequest(githubClient, options);
  })
  .catch((error) => {
    logger.error('Error reporting build status to GitHub: ', error);
  });
};


module.exports = { reportBuildStatus };
