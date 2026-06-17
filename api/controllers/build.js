const merge = require('lodash.merge');

const { fetchModelById } = require('../utils/queryDatabase');
const buildSerializer = require('../serializers/build');
const SourceCodePlatformHelper = require('../services/SourceCodePlatformHelper');
const siteAuthorizer = require('../authorizers/site');
const EventCreator = require('../services/EventCreator');
const { wrapHandlers } = require('../utils');
const { Build, Domain, Event, Site, User, SiteBranchConfig } = require('../models');
const siteErrors = require('../responses/siteErrors');
const { BuildService } = require('../services/build');

const decodeb64 = (str) => Buffer.from(str, 'base64').toString('utf8');

module.exports = wrapHandlers({
  async find(req, res) {
    const site = await fetchModelById(req.params.site_id, Site);

    if (!site) {
      return res.notFound();
    }

    await siteAuthorizer.findOne(req.user, site);
    const builds = await Build.findAll({
      attributes: ['id'],
      where: {
        site: site.id,
      },
      order: [['createdAt', 'desc']],
      limit: 100,
    });
    const buildJSON = await buildSerializer.serialize(builds);
    return res.json(buildJSON);
  },

  /**
   * req.body will contain some combination of a `siteId` property, and either
   * a `buildId` or a `branch` and `sha`.
   * For example: { buildId: 1, siteId: 1 } OR
   * { siteId: 1, branch: 'master', sha: '123abc' }
   *
   * We may want to consider just using shas in the future, although there are edge cases
   * in which a build record can be saved without a sha.
   *
   * It might also be worth nesting builds within a site,
   * since they are only ever used in that context.
   * Then we don't have to explicity pass the site id as a param to this controller
   *
   * e.g. `sites/1/builds/1`
   */

  async findById(req, res) {
    const { user, params } = req;
    const { id } = params;
    const build = await Build.forSiteUser(user).findByPk(id);
    if (!build) {
      return res.notFound();
    }
    const buildJSON = await buildSerializer.serialize(build);
    return res.json(buildJSON);
  },

  async create(req, res) {
    await siteAuthorizer.createBuild(req.user, {
      id: req.body.siteId,
    });
    const requestBuild = await Build.findOne({
      where: {
        id: req.body.buildId,
        site: req.body.siteId,
      },
      include: Site,
    });

    if (!requestBuild) {
      return res.notFound();
    }

    if (requestBuild.state === 'invalid') {
      return res.status(422).json({
        message: siteErrors.INVALID_BRANCH_NAME,
        errors: siteErrors.INVALID_BRANCH_NAME,
      });
    }

    const queuedBuild = await Build.findOne({
      where: {
        site: requestBuild.site,
        branch: requestBuild.branch,
        state: ['created', 'queued'],
      },
    });

    if (!queuedBuild) {
      const rebuild = await BuildService.createBuild(
        {
          branch: requestBuild.branch,
          site: requestBuild.site,
          user: req.user.id,
          username: req.user.username,
          requestedCommitSha:
            requestBuild.clonedCommitSha || requestBuild.requestedCommitSha,
        },
        SourceCodePlatformHelper.flows.FLOW___CORE_REBUILD,
      );
      await rebuild.enqueue();
      rebuild.Site = requestBuild.Site;
      await SourceCodePlatformHelper.reportBuildStatus(rebuild);
      const rebuildJSON = await buildSerializer.serialize(rebuild);
      return res.json(rebuildJSON);
    }
    return res.ok({});
  },

  async status(req, res) {
    const { params, body } = req;

    const build = await fetchModelById(params.id, Build, { include: [Site, User] });

    if (!build) {
      return res.notFound();
    }
    if (build.token !== params.token) {
      return res.forbidden();
    }

    await SourceCodePlatformHelper.refreshUserGitLabTokenIfNeeded(
      build.user,
      build.site.sourceCodePlatform,
      SourceCodePlatformHelper.flows.FLOW___BUILD_STATUS,
    );

    const buildStatus = {
      status: body.status,
      commitSha: body.commit_sha,
    };

    try {
      buildStatus.message = decodeb64(body.message);
    } catch (err) {
      EventCreator.error(Event.labels.BUILD_STATUS, err, {
        buildId: build.id,
      });
    }

    await build.updateJobStatus(buildStatus);

    // The `requestedCommitSha` will not be present for initial builds
    // and there is no need to report status to Github
    if (build.requestedCommitSha) {
      await SourceCodePlatformHelper.reportBuildStatus(build);
    }

    return res.ok();
  },

  async metrics(req, res) {
    const { params, body } = req;

    const build = await fetchModelById(params.id, Build, {
      include: [
        {
          model: Site,
          include: [Domain, SiteBranchConfig],
        },
      ],
    });

    if (!build) {
      return res.notFound();
    }
    if (build.token !== params.token) {
      return res.forbidden();
    }

    // use the full body to update the metrics, requires merge for nested metrics
    const metrics = merge({}, build.metrics, body);
    await build.update({
      metrics,
    });

    return res.ok();
  },
});
