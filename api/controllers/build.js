const buildSerializer = require('../serializers/build');
const GithubBuildStatusReporter = require('../services/GithubBuildStatusReporter');
const siteAuthorizer = require('../authorizers/site');
const BuildResolver = require('../services/BuildResolver');
const { Build, Site } = require('../models');
const logger = require('winston');

const decodeb64 = str => new Buffer(str, 'base64').toString('utf8');

function emitBuildStatus(socket, build) {
  try {
    const msg = { id: build.id, state: build.state, site: build.site, branch: build.branch };
    socket.emit('build status', msg);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  find: (req, res) => {
    let site;

    Promise.resolve(Number(req.params.site_id))
    .then((id) => {
      if (isNaN(id)) { throw 404; }
      return Site.findById(id);
    })
    .then((model) => {
      if (!model) { throw 404; }
      site = model;
      return siteAuthorizer.findOne(req.user, site);
    })
    .then(() =>
      Build.findAll({
        attributes: ['id'],
        where: { site: site.id },
        order: [['createdAt', 'desc']],
        limit: 100,
      })
    )
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
    .then(build =>
      Build.create({
        branch: build.branch,
        site: build.site,
        user: req.user.id,
        commitSha: build.commitSha,
      })
    )
    .then(build =>
      GithubBuildStatusReporter
      .reportBuildStatus(build)
      .then(() => build)
    )
    .then(build => buildSerializer.serialize(build))
    .then(buildJSON => res.json(buildJSON))
    .catch(res.error);
  },

  status: (req, res) => {
    const message = decodeb64(req.body.message);
    Promise.resolve(Number(req.params.id))
    .then((id) => {
      if (isNaN(id)) {
        throw 404;
      }
      return Build.findById(id);
    })
    .then((build) => {
      if (!build) {
        throw 404;
      } else if (build.token !== req.params.token) {
        throw 403;
      } else {
        return build.completeJob(message);
      }
    })
    .then((build) => {
      emitBuildStatus(res.socket, build);
      return GithubBuildStatusReporter.reportBuildStatus(build);
    })
    .then(() => res.ok())
    .catch(res.error);
  },
};
