const config = require('../../config');
const { Build, User, Site, Event, Organization } = require('../models');
const authorizer = require('../authorizers/site');
const SourceCodePlatformHelper = require('./SourceCodePlatformHelper');
const EventCreator = require('./EventCreator');
const SiteDestroyer = require('../services/SiteDestroyer');
const { fetchModelById } = require('../utils/queryDatabase');
const { BuildService } = require('./build');
const { isWorkshopPlatform } = require('./SourceCodePlatformHelper');
const { logger } = require('../../winston');
const { gitlabLogUserInfo } = require('../utils/gitlabLogger');

const { OPS_EMAIL } = process.env;

const getOwnerAndRepository = (payload, sourceCodePlatform) => {
  if (SourceCodePlatformHelper.isWorkshopPlatform(sourceCodePlatform)) {
    return { owner: payload?.owner, repository: payload?.repository?.repository_path };
  } else {
    const [owner, repository] = payload.repository.full_name.split('/');
    return { owner, repository };
  }
};

const findSiteForWebhookRequest = (payload, sourceCodePlatform) => {
  const { owner, repository } = getOwnerAndRepository(payload, sourceCodePlatform);

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

  logger.info(`Creating Build with site id: ${siteId} `);
  const build = await BuildService.createBuild(
    {
      branch,
      site: siteId,
      user: userId,
      username,
      isEditorSiteBuild: true,
    },
    SourceCodePlatformHelper.flows.FLOW___EDITOR_BUILD,
  );

  return build.enqueue();
};

const deleteEditorSite = async (siteId) => {
  const user = await User.byUAAEmail(OPS_EMAIL).findOne();
  const site = await fetchModelById(siteId, Site.forUser(user));

  if (!site) {
    return { status: 'not found' };
  }

  await authorizer.destroy(user, site);
  const [status, message] = await SiteDestroyer.destroySite(site, user);

  if (status !== 'ok') {
    return { status, message };
  }

  EventCreator.audit(Event.labels.USER_ACTION, user, 'Site Destroyed', {
    site,
  });

  return { status: 'ok' };
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

async function findBuildUser(site, gitlabUserId, username) {
  if (isWorkshopPlatform(site.sourceCodePlatform)) {
    const user = await User.findOne({
      where: { gitlabUserId: gitlabUserId },
    });
    logger.info(
      // eslint-disable-next-line max-len
      `GitLab: found user ${gitlabLogUserInfo(user)} for webhook request with user id ${gitlabUserId}`,
    );
    return user;
  } else {
    return await User.findOne({
      where: { username },
    });
  }
}

const createBuildForWebhookRequest = async (payload, site) => {
  const { login, gitlabUserId } = payload.sender;
  const { pushed_at: pushedAt } = payload.repository;
  const username = login.toLowerCase();

  // it's okay if we don't find a valid User here since we'll
  // still search for a token in loadBuildUserAccessToken
  let user = await findBuildUser(site, gitlabUserId, username);
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
    include: [User],
  });

  if (queuedBuild) {
    return queuedBuild.update({
      requestedCommitSha,
      user: user ? user.id : queuedBuild.User?.id,
      username,
    });
  }

  const build = await BuildService.createBuild(
    {
      branch,
      requestedCommitSha,
      site: site.id,
      user: user ? user.id : null,
      username,
    },
    SourceCodePlatformHelper.flows.FLOW__WEBHOOK_BUILD,
  );

  return await BuildService.enqueueOrLogBuild(build);
};

const pushWebhookRequest = async (
  payload,
  sourceCodePlatform = Site.Platforms.Github,
) => {
  if (payload.commits && payload.commits.length > 0) {
    const sites = await findSiteForWebhookRequest(payload, sourceCodePlatform);

    await Promise.all(
      sites.map(async (site) => {
        if (shouldBuildForSite(site)) {
          const build = await createBuildForWebhookRequest(payload, site);
          await build.reload({ include: Site, User });
          await SourceCodePlatformHelper.reportBuildStatus(build);
        }
      }),
    );
  }
};

const deleteCreateWebhook = async (site, user) => {
  await SourceCodePlatformHelper.deleteWebhook(site, user);
  await SourceCodePlatformHelper.createSiteWebhook(user, site);

  return site;
};

const resetWebhook = async (siteId) => {
  const user = await User.byUAAEmail(OPS_EMAIL).findOne();
  const site = await Site.findByPk(siteId);

  return deleteCreateWebhook(site, user);
};

module.exports = {
  createBuildForEditor,
  deleteEditorSite,
  organizationWebhookRequest,
  pushWebhookRequest,
  getOwnerAndRepository,
  resetWebhook,
};
