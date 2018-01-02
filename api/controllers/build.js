const authorizer = require('../authorizers/build');
const buildSerializer = require('../serializers/build');
const GithubBuildStatusReporter = require('../services/GithubBuildStatusReporter');
const siteAuthorizer = require('../authorizers/site');
const { Build, Site } = require('../models');

const decodeb64 = str => new Buffer(str, 'base64').toString('utf8');

module.exports = {
  find: (req, res) => {
    let site;

    Promise.resolve(Number(req.params.site_id))
    .then((id) => {
      if (isNaN(id)) {
        const error = new Error();
        error.status = 404;
        throw error;
      }
      return Site.findById(id);
    })
    .then((model) => {
      if (!model) {
        const error = new Error();
        error.status = 404;
        throw error;
      }

      site = model;
      return siteAuthorizer.findOne(req.user, site);
    })
    .then(() =>
      Build.findAll({
        where: { site: site.id },
        order: [['createdAt', 'desc']],
        limit: 100,
      })
    )
    .then(builds => buildSerializer.serialize(builds))
    .then(buildJSON => res.json(buildJSON))
    .catch(res.error);
  },

  create: (req, res) => {
    authorizer.create(req.user, req.body)
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

  findOne: (req, res) => {
    let build;

    Promise.resolve(Number(req.params.id))
    .then((id) => {
      if (isNaN(id)) {
        const error = new Error();
        error.status = 404;
        throw error;
      }
      return Build.findById(id);
    })
    .then((model) => {
      if (model) {
        build = model;
      } else {
        res.notFound();
      }
      return authorizer.findOne(req.user, { buildId: build.id, siteId: build.site });
    })
    .then(() => buildSerializer.serialize(build))
    .then(buildJSON => res.json(buildJSON))
    .catch(res.error);
  },

  status: (req, res) => {
    const message = decodeb64(req.body.message);

    Promise.resolve(Number(req.params.id))
    .then((id) => {
      if (isNaN(id)) {
        const error = new Error();
        error.status = 404;
        throw error;
      }
      return Build.findById(id);
    })
    .then((build) => {
      if (!build) {
        const error = new Error();
        error.status = 404;
        throw error;
      } else {
        return build.completeJob(message);
      }
    })
    .then(build => GithubBuildStatusReporter.reportBuildStatus(build))
    .then(() => res.ok())
    .catch(res.error);
  },
};
