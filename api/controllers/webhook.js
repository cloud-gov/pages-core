const crypto = require('crypto');
const Sequelize = require('sequelize');
const config = require('../../config');
const buildSerializer = require('../serializers/build');
const GithubBuildStatusReporter = require('../services/GithubBuildStatusReporter');
const EventCreator = require('../services/EventCreator');
const {
  Build, User, Site, Event,
} = require('../models');
const { logger } = require('../../winston');

const signBlob = (key, blob) => `sha1=${crypto.createHmac('sha1', key).update(blob).digest('hex')}`;

const findUserForWebhookRequest = (request) => {
  const username = request.body.sender.login;

  return User.findOrCreate({
    where: { username: username.toLowerCase() },
    defaults: {
      username,
      active: false,
    },
  })
    .then((users) => {
      if (!users.length) {
        throw new Error(`Unable to find or create Federalist user with username ${username}`);
      } else {
        return users[0];
      }
    });
};

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
    logger.warn(`Not a ${config.federalistUsers.orgName} membership action:\t${JSON.stringify(payload)}`);
    return;
  }

  const { user: { login } } = membership;
  const username = login.toLowerCase();
  const user = await User.findOne({ where: { username } });

  if (['member_added', 'member_removed', 'member_invited'].includes(action)) {
    EventCreator.audit(Event.labels.FEDERALIST_USERS, user || User.build({ username }), payload);
  }

  if (user) {
    if (action === 'member_added') {
      await user.update({ isActive: true });
      EventCreator.audit(Event.labels.UPDATED, user, { action: { isActive: true } });
    }

    if (action === 'member_removed') {
      await user.update({ isActive: false });
      EventCreator.audit(Event.labels.UPDATED, user, { action: { isActive: false } });
    }
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
  const [user, site] = await Promise.all([
    findUserForWebhookRequest(request),
    findSiteForWebhookRequest(request),
  ]);

  await addUserToSite({ user, site });

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
      user: user.id,
    });
  }

  return Build.create({
    branch,
    commitSha,
    site: site.id,
    user: user.id,
  })
    .then(build => build.enqueue());
};

module.exports = {
  github(req, res) {
    signWebhookRequest(req)
      .then(() => {
        if (req.body.commits && req.body.commits.length > 0) {
          return createBuildForWebhookRequest(req);
        }

        return null;
      })
      .then((build) => {
        if (!build) {
          res.ok('No new commits found. No build scheduled.');
          return null;
        }

        return GithubBuildStatusReporter.reportBuildStatus(build)
          .then(() => buildSerializer.serialize(build));
      })
      .then((buildJSON) => {
        if (buildJSON) {
          res.json(buildJSON);
        }
      })
      .catch((err) => {
        logger.error(err);
        if (err.message) {
          res.badRequest(err);
        } else {
          res.badRequest();
        }
      });
  },
  organization(req, res) {
    signWebhookRequest(req)
      .then(() => organizationWebhookRequest(req.body))
      .then(() => res.ok())
      .catch((err) => {
        logger.error(err);
        if (err.message) {
          res.badRequest(err);
        } else {
          res.badRequest();
        }
      });
  },
};
