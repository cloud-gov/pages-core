/* eslint-disable no-await-in-loop */
const buildSerializer = require('../../serializers/build');
const BuildLogs = require('../../services/build-logs');
const { Build, Site } = require('../../models');
const { fetchModelById } = require('../../utils/queryDatabase');
const { paginate, wrapHandlers } = require('../../utils');

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

    const build = await fetchModelById(id, Build, { include: [Site] });
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
      ? await BuildLogs.getBuildLogs(build)
      : await BuildLogs.fetchBuildLogs(build).then(r => r.logs);

    return res.json(buildLogs);
  },
});
