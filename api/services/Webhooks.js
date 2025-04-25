const config = require('../../config');
const { Build, User, Site, Event, Organization } = require('../models');
const GithubBuildHelper = require('./GithubBuildHelper');
const EventCreator = require('./EventCreator');

const { OPS_EMAIL } = process.env;

const findSiteForWebhookRequest = (payload) => {
  const [owner, repository] = payload.repository.full_name.split('/');

  return Site.findAll({
    where: {
      owner: owner.toLowerCase(),
      repository: repository.toLowerCase(),
    },
    include: [Organization],
  });
};

const createBuildForEditor = async (siteId) => {
  const branch = 'main';
  const { id: userId, username } = await User.byUAAEmail(OPS_EMAIL).findOne();

  const queuedBuild = await Build.findOne({
    where: {
      branch,
      state: ['created', 'queued'],
      site: siteId,
    },
  });

  if (queuedBuild) {
    return;
  }

  const build = await Build.create({
    branch,
    site: siteId,
    user: userId,
    username,
  });

  return build.enqueue();
};

const shouldBuildForSite = (site) =>
  site?.isActive && (!site.Organization || site.Organization.isActive);

const organizationWebhookRequest = async (payload) => {
  const {
    action,
    membership,
    organization: { login: orgName },
  } = payload;

  if (
    orgName !== config.federalistUsers.orgName ||
    !['member_added', 'member_removed'].includes(action)
  ) {
    return;
  }

  const { login } = membership.user;
  const username = login.toLowerCase();
  let user = await User.scope('withUAAIdentity').findOne({
    where: { username },
  });

  const isActive = action === 'member_added';

  if (!user && isActive) {
    user = await User.create({
      username,
    });
  }

  if (user?.UAAIdentity) {
    return;
  }

  if (user) {
    EventCreator.audit(Event.labels.FEDERALIST_USERS_MEMBERSHIP, user, action);
  }
};

const createBuildForWebhookRequest = async (payload, site) => {
  const { login } = payload.sender;
  const { pushed_at: pushedAt } = payload.repository;
  const username = login.toLowerCase();

  // it's okay if we don't find a valid User here since we'll
  // still search for a token in loadBuildUserAccessToken
  const user = await User.findOne({
    where: { username },
  });
  if (user) {
    await user.update({
      pushedAt: new Date(pushedAt * 1000),
    });
  }

  const branch = payload.ref.replace('refs/heads/', '');
  const requestedCommitSha = payload.after;

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
  }).then((build) => build.enqueue());
};

const pushWebhookRequest = async (payload) => {
  if (payload.commits && payload.commits.length > 0) {
    const sites = await findSiteForWebhookRequest(payload);

    await Promise.all(
      sites.map(async (site) => {
        if (shouldBuildForSite(site)) {
          const build = await createBuildForWebhookRequest(payload, site);
          await build.reload({ include: Site });
          await GithubBuildHelper.reportBuildStatus(build);
        }
      }),
    );
  }
};

module.exports = {
  createBuildForEditor,
  organizationWebhookRequest,
  pushWebhookRequest,
};
