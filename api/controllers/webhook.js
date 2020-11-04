const crypto = require('crypto');
const Sequelize = require('sequelize');
const config = require('../../config');
const GithubBuildStatusReporter = require('../services/GithubBuildStatusReporter');
const EventCreator = require('../services/EventCreator');
const {
  Build, User, Site, Event,
} = require('../models');
const { logger } = require('../../winston');

const signBlob = (key, blob) => `sha1=${crypto.createHmac('sha1', key).update(blob).digest('hex')}`;

const findSiteForWebhookRequest = (request) => {
  const owner = request.body.repository.full_name.split('/')[0].toLowerCase();
  const repository = request.body.repository.full_name.split('/')[1].toLowerCase();

  return Site.findOne({
    where: {
      owner,
      repository,
      buildStatus: { [Sequelize.Op.ne]: 'inactive' },
    },
  })
    .then((site) => {
      if (!site) {
        throw new Error(`Unable to find an active Federalist site with ${owner}/${repository}`);
      } else {
        return site;
      }
    });
};

const organizationWebhookRequest = async (payload) => {
  const {
    action, membership, organization,
  } = payload;
  const { login: orgName } = organization;

  if (orgName !== config.federalistUsers.orgName) {
    return;
  }

  const { login } = membership.user;
  const username = login.toLowerCase();
  const user = await User.findOne({ where: { username } });

  if (['member_added', 'member_removed', 'member_invited'].includes(action)) {
    EventCreator.audit(Event.labels.FEDERALIST_USERS, user || User.build({ username }), payload);
  }

  if (action === 'member_added') {
    if (!user) {
      await User.create({
        username,
        isActive: true,
      });
    } else if (!user.isActive) {
      await user.update({ isActive: true });
    }
  } else if (action === 'member_removed' && user && user.isActive) {
    await user.update({ isActive: false });
  }
};

const addUserToSite = ({ user, site }) => user.addSite(site);

const signWebhookRequest = request => new Promise((resolve, reject) => {
  const webhookSecret = config.webhook.secret;
  const requestBody = JSON.stringify(request.body);

  const signature = request.headers['x-hub-signature'];
  const signedRequestBody = signBlob(webhookSecret, requestBody);

  if (!signature) {
    reject(new Error('No X-Hub-Signature found on request'));
  } else if (signature !== signedRequestBody) {
    reject(new Error('X-Hub-Signature does not match blob signature'));
  } else {
    resolve(true);
  }
});

const createBuildForWebhookRequest = async (request) => {
  const { login } = request.body.sender;
  const { pushed_at: pushedAt } = request.body.repository;
  const username = login.toLowerCase();
  const user = await User.findOne({ where: { username } });
  const site = findSiteForWebhookRequest(request);

  if (user) {
    await user.update({ pushedAt: new Date(pushedAt * 1000) });
    await addUserToSite({ user, site });
  }

  const branch = request.body.ref.replace('refs/heads/', '');
  const commitSha = request.body.after;

  const queuedBuild = await Build.findOne({
    where: {
      branch,
      state: ['created', 'queued'],
      site: site.id,
    },
  });

  if (queuedBuild) {
    return queuedBuild.update({
      commitSha,
      username,
    });
  }

  return Build.create({
    branch,
    commitSha,
    site: site.id,
    username,
  })
    .then(build => build.enqueue());
};

module.exports = {
  github: (req, res) => signWebhookRequest(req)
    .then(() => {
      if (req.body.commits && req.body.commits.length > 0) {
        return createBuildForWebhookRequest(req);
      }
      return Promise.resolve();
    })
    .then((build) => {
      if (build) {
        return GithubBuildStatusReporter.reportBuildStatus(build);
      }
      return Promise.resolve();
    })
    .then(() => res.ok())
    .catch((err) => {
      logger.error(err);
      res.badRequest();
    }),
  organization: (req, res) => signWebhookRequest(req)
    .then(() => organizationWebhookRequest(req.body))
    .then(() => res.ok())
    .catch((err) => {
      logger.error(err);
      res.badRequest();
    }),
};
