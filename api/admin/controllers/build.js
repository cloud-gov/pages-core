/* eslint-disable no-await-in-loop */
const buildSerializer = require('../../serializers/build');
const BuildLogs = require('../../services/build-logs');
const GithubBuildHelper = require('../../services/GithubBuildHelper');

const {
  Build, Site, User, Event,
} = require('../../models');
const { fetchModelById } = require('../../utils/queryDatabase');
const { paginate, wrapHandlers } = require('../../utils');
const EventCreator = require('../../services/EventCreator');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, site,
    } = req.query;

    const scopes = [];

    if (site) {
      scopes.push(Build.siteScope(site));
    }

    const [pagination, sites] = await Promise.all([
      paginate(Build.scope(scopes), buildSerializer.serialize, { limit, page }),
      Site.findAll({ attributes: ['id', 'owner', 'repository'], raw: true }),
    ]);

    const json = {
      meta: { sites },
      ...pagination,
    };

    return res.json(json);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const build = await fetchModelById(id, Build, { include: [Site, User] });
    if (!build) return res.notFound();

    return res.json(buildSerializer.serializeObject(build));
  },

  async findBuildLog(req, res) {
    const {
      params: { id },
    } = req;

    const build = await fetchModelById(id, Build);
    if (!build) return res.notFound();

    const buildLogs = build.logsS3Key
      ? await BuildLogs.getBuildLogs(build).then(r => r.output.join('\n'))
      : await BuildLogs.fetchBuildLogs(build).then(r => r.logs);

    return res.json(buildLogs);
  },

  async update(req, res) {
    const {
      body: { state },
      params: { id },
    } = req;

    const build = await fetchModelById(id, Build, { include: [Site, User] });
    if (!build) return res.notFound();

    await build.update({ state });
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'Build Updated', { build: { id, state } });

    return res.json(buildSerializer.serializeObject(build));
  },

  async rebuild(req, res) {
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
});
