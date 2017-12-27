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

  /**
   * Create a new build using data from an existing build
   * Currently, the only way for a user to directly create a new build is
   * the `restart build` interface in the site builds view.
   *
   * This method is named `restart` as it's
   * not otherwise possible to create a build via the API.
   */
  restart: (req, res) => {
    let params;

    Build.findById(req.body.buildId, { include: [Site] })
    .then((build) => {
      if (!build) {
        throw 404;
      }

      params = {
        branch: build.get('branch'),
        site: build.get('Site').get('id'),
        user: req.user.id,
        commitSha: build.get('commitSha'),
      };

      return authorizer.create(req.user, params);
    })
    .then(() => Build.create(params))
    .then(build =>
      GithubBuildStatusReporter.reportBuildStatus(build)
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
      return authorizer.findOne(req.user, build);
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
