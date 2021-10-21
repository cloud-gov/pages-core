const config = require('../../config');
const {
  Build, User, Site, Event, Organization,
} = require('../models');
const GithubBuildHelper = require('./GithubBuildHelper');
const EventCreator = require('./EventCreator');

const findSiteForWebhookRequest = (payload) => {
  const [owner, repository] = payload.repository.full_name.split('/');

  return Site.findOne({
    where: {
      owner: owner.toLowerCase(),
      repository: repository.toLowerCase(),
    },
    include: [
      { model: User },
      { model: Organization },
    ],
  });
};

const shouldBuildForSite = site => site && site.buildStatus !== 'inactive'
  && (!site.Organization || site.Organization.isActive);

const organizationWebhookRequest = async (payload) => {
  const {
    action,
    membership,
    organization: {
      login: orgName,
    },
  } = payload;

  if (
    orgName !== config.federalistUsers.orgName
    || !['member_added', 'member_removed'].includes(action)
  ) {
    return;
  }

  const { login } = membership.user;
  const username = login.toLowerCase();
  let user = await User.scope('withUAAIdentity').findOne({ where: { username } });

  const isActive = action === 'member_added';

  if (!user && isActive) {
    user = await User.create({ username });
  }

  if (user?.UAAIdentity) {
    return;
  }

  if (user) {
    if (isActive !== user.isActive) {
      await user.update({ isActive });
    }
    EventCreator.audit(Event.labels.FEDERALIST_USERS_MEMBERSHIP, user, action);
  }
};

const createBuildForWebhookRequest = async (payload, site) => {
  const { login } = payload.sender;
  const { pushed_at: pushedAt } = payload.repository;
  const username = login.toLowerCase();

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
  })
    .then(build => build.enqueue());
};

const pushWebhookRequest = async (payload) => {
  if (payload.commits && payload.commits.length > 0) {
    const site = await findSiteForWebhookRequest(payload);
    if (shouldBuildForSite(site)) {
      const build = await createBuildForWebhookRequest(payload, site);
      await build.reload({ include: [{ model: Site, include: [{ model: User }] }] });
      await GithubBuildHelper.reportBuildStatus(build);
    }
  }
};

module.exports = {
  organizationWebhookRequest,
  pushWebhookRequest,
};
