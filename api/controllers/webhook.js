const crypto = require('crypto');
const Sequelize = require('sequelize');
const config = require('../../config');
const GithubBuildHelper = require('../services/GithubBuildHelper');
const EventCreator = require('../services/EventCreator');
const {
  Build, User, Site, Event,
} = require('../models');

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
    include: [{ model: User }],
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
  let user = await User.findOne({ where: { username } });

  if (['member_added', 'member_removed'].includes(action)) {
    const isActive = action === 'member_added';

    if (!user && isActive) {
      user = await User.create({ username });
    }
    if (user) {
      if (isActive !== user.isActive) {
        await user.update({ isActive });
      }
      EventCreator.audit(Event.labels.FEDERALIST_USERS_MEMBERSHIP, user, payload);
    }
  }
};

const signWebhookRequest = (request) => {
  const webhookSecret = config.webhook.secret;
  const requestBody = JSON.stringify(request.body);

  const signature = request.headers['x-hub-signature'];
  const signedRequestBody = signBlob(webhookSecret, requestBody);

  if (!signature) {
    throw new Error('No X-Hub-Signature found on request');
  } else if (signature !== signedRequestBody) {
    throw new Error('X-Hub-Signature does not match blob signature');
  }
};

const createBuildForWebhookRequest = async (request) => {
  const { login } = request.body.sender;
  const { pushed_at: pushedAt } = request.body.repository;
  const username = login.toLowerCase();
  const site = await findSiteForWebhookRequest(request);

  let user = site.Users.find(u => u.username === username);
  if (!user) {
    user = await User.findOne({ where: { username } });
    if (user) {
      await site.addUser(user);
    }
  }
  if (user) {
    await user.update({ pushedAt: new Date(pushedAt * 1000) });
  }

  const branch = request.body.ref.replace('refs/heads/', '');
  const requestedCommitSha = request.body.after;

  const queuedBuild = await Build.findOne({
    where: {
      branch,
      state: ['created', 'queued'],
      site: site.id,
    },
  });

  if (queuedBuild) {
    return queuedBuild.update({
      requestedCommitSha,
      user: user ? user.id : null,
      username,
    });
  }

  return Build.create({
    branch,
    requestedCommitSha,
    site: site.id,
    user: user ? user.id : null,
    username,
  })
    .then(build => build.enqueue());
};

module.exports = {
  github: async (req, res) => {
    try {
      let build;
      signWebhookRequest(req);
      if (req.body.commits && req.body.commits.length > 0) {
        build = await createBuildForWebhookRequest(req);
        await build.reload({ include: [{ model: Site, include: [{ model: User }] }] });
        await GithubBuildHelper.reportBuildStatus(build);
      }
      res.ok();
    } catch (err) {
      EventCreator.error(Event.labels.BUILD_REQUEST, ['Error processing push webhook', JSON.stringify(req.body), err.stack]);
      res.badRequest();
    }
  },
  organization: async (req, res) => {
    try {
      signWebhookRequest(req);
      await organizationWebhookRequest(req.body);
      res.ok();
    } catch (err) {
      EventCreator.error(Event.labels.FEDERALIST_USERS_MEMBERSHIP, ['Error processing organization webhook', JSON.stringify(req.body), err.stack]);
      res.badRequest();
    }
  },
};
