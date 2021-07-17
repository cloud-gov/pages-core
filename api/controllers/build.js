const { fetchModelById } = require('../utils/queryDatabase');
const buildSerializer = require('../serializers/build');
const GithubBuildHelper = require('../services/GithubBuildHelper');
const siteAuthorizer = require('../authorizers/site');
const SocketIOSubscriber = require('../services/SocketIOSubscriber');
const EventCreator = require('../services/EventCreator');
const ProxyDataSync = require('../services/ProxyDataSync');
const { wrapHandlers } = require('../utils');
const {
  Build, Site, User, Event,
} = require('../models');
const socketIO = require('../socketIO');
const Features = require('../features');

const decodeb64 = str => Buffer.from(str, 'base64').toString('utf8');
const BUILD_SETTINGS_FILE = 'federalist.json';

const emitBuildStatus = async (build) => {
  try {
    const site = await Site.findByPk(build.site);
    const msg = {
      id: build.id,
      state: build.state,
      site: build.site,
      branch: build.branch,
      owner: site.owner,
      repository: site.repository,
    };
    const siteRoom = SocketIOSubscriber.getSiteRoom(build.site);
    socketIO.to(siteRoom).emit('build status', msg);
    const builderRoom = SocketIOSubscriber.getBuilderRoom(build.site, build.user);
    socketIO.to(builderRoom).emit('build status', msg);
  } catch (err) {
    EventCreator.error(Event.labels.SOCKET_IO, err, { buildId: build.id });
  }
};

const saveBuildToProxy = async (build) => {
  const buildSettings = await GithubBuildHelper.fetchContent(build, BUILD_SETTINGS_FILE);
  if (buildSettings) {
    const settings = JSON.parse(buildSettings);
    await ProxyDataSync.saveBuild(build, settings);
    const body = {
      filename: BUILD_SETTINGS_FILE,
      commitSha: build.clonedCommitSha,
    };
    const message = `${BUILD_SETTINGS_FILE} saved to proxy database`;
    EventCreator.audit(Event.labels.PROXY_EDGE, build, message, body);
  }
};

module.exports = wrapHandlers({
  async find(req, res) {
    const site = await fetchModelById(req.params.site_id, Site);
    if (!site) {
      return res.notFound();
    }

    await siteAuthorizer.findOne(req.user, site);
    const builds = await Build.findAll({
      attributes: ['id'],
      where: { site: site.id },
      order: [['createdAt', 'desc']],
      limit: 100,
    });
    const buildJSON = await buildSerializer.serialize(builds);
    return res.json(buildJSON);
  },

  /**
   * req.body will contain some combination of a `siteId` property, and either
   * a `buildId` or a `branch` and `sha`.
   * For example: { buildId: 1, siteId: 1 } OR { siteId: 1, branch: 'master', sha: '123abc' }
   *
   * We may want to consider just using shas in the future, although there are edge cases
   * in which a build record can be saved without a sha.
   *
   * It might also be worth nesting builds within a site, since they are only ever used in that
   * context. Then we don't have to explicity pass the site id as a param to this controller
   *
   * e.g. `sites/1/builds/1`
   */
  async create(req, res) {
    await siteAuthorizer.createBuild(req.user, { id: req.body.siteId });
    const requestBuild = await Build.findOne({
      where: {
        id: req.body.buildId,
        site: req.body.siteId,
      },
      include: [{ model: Site, include: [{ model: User }] }],
    });

    if (!requestBuild) {
      return res.notFound();
    }

    const queuedBuild = await Build.findOne({
      where: {
        site: requestBuild.site,
        branch: requestBuild.branch,
        state: ['created', 'queued'],
      },
    });

    if (!queuedBuild) {
      const rebuild = await Build.create({
        branch: requestBuild.branch,
        site: requestBuild.site,
        user: req.user.id,
        username: req.user.username,
        requestedCommitSha: requestBuild.clonedCommitSha || requestBuild.requestedCommitSha,
      });
      await rebuild.enqueue();
      rebuild.Site = requestBuild.Site;
      await GithubBuildHelper.reportBuildStatus(rebuild);
      const rebuildJSON = await buildSerializer.serialize(rebuild);
      return res.json(rebuildJSON);
    }
    return res.ok({});
  },

  async status(req, res) {
    const { params, body } = req;

    const build = await fetchModelById(params.id, Build, {
      include: [{ model: Site, include: [{ model: User }] }],
    });

    if (!build) {
      return res.notFound();
    }
    if (build.token !== params.token) {
      return res.forbidden();
    }

    const buildStatus = {
      status: body.status,
      commitSha: body.commit_sha,
    };

    try {
      buildStatus.message = decodeb64(body.message);
    } catch (err) {
      EventCreator.error(Event.labels.BUILD_STATUS, err, { buildId: build.id });
    }

    await build.updateJobStatus(buildStatus);

    emitBuildStatus(build);

    // The `requestedCommitSha` will not be present for initial builds
    // and there is no need to report status to Github
    if (build.requestedCommitSha) {
      await GithubBuildHelper.reportBuildStatus(build);
    }

    if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
      if (buildStatus.status === Build.States.Success) {
        await saveBuildToProxy(build);
      }
    }

    return res.ok();
  },
});
