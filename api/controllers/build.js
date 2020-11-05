const { logger } = require('../../winston');

const { fetchModelById } = require('../utils/queryDatabase');
const buildSerializer = require('../serializers/build');
const GithubBuildStatusReporter = require('../services/GithubBuildStatusReporter');
const siteAuthorizer = require('../authorizers/site');
const BuildResolver = require('../services/BuildResolver');
const SocketIOSubscriber = require('../services/SocketIOSubscriber');
const { Build, Site } = require('../models');
const socketIO = require('../socketIO');

const decodeb64 = str => Buffer.from(str, 'base64').toString('utf8');

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
      .then(() => BuildResolver.getBuild(req.user, req.body))
      .then(b => Build.findOne({
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
              commitSha: b.commitSha,
            })
              .then(build => build.enqueue())
              .then(build => GithubBuildStatusReporter
                .reportBuildStatus(build)
                .then(() => build))
              .then(build => buildSerializer.serialize(build))
              .then(buildJSON => res.json(buildJSON));
          }
          return res.ok({});
        }))
      .catch(res.error);
  },

  status: (req, res) => {
    let buildStatus;

    const getBuildStatus = (statusRequest) => {
      let status;
      let message;
      try {
        status = statusRequest.body.status;
        message = decodeb64(statusRequest.body.message);
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
      return { status, message };
    };

    Promise.resolve(getBuildStatus(req))
      .then((_buildStatus) => {
        buildStatus = _buildStatus;
        return Promise.resolve(Number(req.params.id));
      })
      .then(id => fetchModelById(id, Build))
      .then((build) => {
        if (!build) {
          throw 404;
        } else if (build.token !== req.params.token) {
          throw 403;
        } else {
          return build.updateJobStatus(buildStatus);
        }
      })
      .then((build) => {
        emitBuildStatus(build);
        return GithubBuildStatusReporter.reportBuildStatus(build);
      })
      .then(() => res.ok())
      .catch((err) => {
        logger.error(['Error build status reporting to GitHub', err, err.stack].join('\n'));
        res.error(err);
      });
  },
};
