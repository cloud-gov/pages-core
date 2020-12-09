const { logger } = require('../../winston');

const { fetchModelById } = require('../utils/queryDatabase');
const buildSerializer = require('../serializers/build');
const GithubBuildHelper = require('../services/GithubBuildHelper');
const siteAuthorizer = require('../authorizers/site');
const SocketIOSubscriber = require('../services/SocketIOSubscriber');
const EventCreator = require('../services/EventCreator');
const ProxyDataSync = require('../services/ProxyDataSync');
const { Build, Site, Event } = require('../models');
const socketIO = require('../socketIO');
const Features = require('../features');

const decodeb64 = str => Buffer.from(str, 'base64').toString('utf8');
const BUILD_SETTINGS_FILE = 'federalist.json';

const emitBuildStatus = build => Site.findByPk(build.site)
  .then((site) => {
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
    return Promise.resolve();
  })
  .catch(err => logger.error(err));

const saveBuildToProxy = async (build, status) => {
  if (status === Build.States.Success) {
    const buildSettings = await GithubBuildHelper.fetchContent(build, BUILD_SETTINGS_FILE);
    if (buildSettings) {
      const settings = JSON.parse(buildSettings);
      await ProxyDataSync.saveBuild(build, settings);
      EventCreator.audit(Event.labels.UPDATED, build, `${BUILD_SETTINGS_FILE} saved to proxy database`);
    }
  }
};

module.exports = {
  find: (req, res) => {
    let site;

    fetchModelById(req.params.site_id, Site)
      .then((model) => {
        if (!model) { throw 404; }
        site = model;
        return siteAuthorizer.findOne(req.user, site);
      })
      .then(() => Build.findAll({
        attributes: ['id'],
        where: { site: site.id },
        order: [['createdAt', 'desc']],
        limit: 100,
      }))
      .then(builds => buildSerializer.serialize(builds))
      .then(buildJSON => res.json(buildJSON))
      .catch(res.error);
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
  create: (req, res) => {
    siteAuthorizer.createBuild(req.user, { id: req.body.siteId })
      .then(() => Build.findOne({
        where: {
          id: req.body.buildId,
          site: req.body.siteId,
        },
      }))
      .then((b) => {
        if (!b) {
          throw 404;
        }
        return Build.findOne({
          where: {
            site: b.site,
            branch: b.branch,
            state: ['created', 'queued'],
          },
        })
          .then((queuedBuild) => {
            if (!queuedBuild) {
              return Build.create({
                branch: b.branch,
                site: b.site,
                user: req.user.id,
                username: req.user.username,
                requestedCommitSha: b.clonedCommitSha || b.requestedCommitSha,
              })
                .then(build => build.enqueue())
                .then(build => GithubBuildHelper
                  .reportBuildStatus(build)
                  .then(() => build))
                .then(build => buildSerializer.serialize(build))
                .then(buildJSON => res.json(buildJSON));
            }
            return res.ok({});
          });
      })
      .catch(res.error);
  },

  status: async (req, res) => {
    const getBuildStatus = (statusRequest) => {
      let status;
      let message;
      let commitSha;
      try {
        status = statusRequest.body.status;
        message = decodeb64(statusRequest.body.message);
        commitSha = statusRequest.body.commit_sha;
      } catch (err) {
        status = 'error';
        message = 'build status message parsing error';
        const errMsg = [
          `Error decoding build status message for build@id=${statusRequest.params.id}`,
          `build@message: ${statusRequest.body.message}`,
          err,
        ];
        logger.error(errMsg.join('\n'));
      }
      return { status, message, commitSha };
    };
    try {
      const buildStatus = getBuildStatus(req);
      const buildId = Number(req.params.id);
      let build = await fetchModelById(buildId, Build);

      if (!build) {
        throw 404;
      } else if (build.token !== req.params.token) {
        throw 403;
      } else {
        build = await build.updateJobStatus(buildStatus);
      }

      emitBuildStatus(build);

      await GithubBuildHelper.reportBuildStatus(build);

      if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
        await saveBuildToProxy(build, buildStatus.status);
      }

      res.ok();
    } catch (err) {
      EventCreator.error(Event.labels.UPDATED, ['Error build status reporting to GitHub', err, err.stack].join('\n'));
      res.error(err);
    }
  },
};
