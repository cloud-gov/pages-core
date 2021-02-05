/* eslint-disable no-await-in-loop */
const buildSerializer = require('../../serializers/build');
const BuildLogs = require('../../services/build-logs');
const { Build, Site } = require('../../models');
const { buildWhereQuery, fetchModelById } = require('../../utils/queryDatabase');
const { paginate, wrapHandlers } = require('../../utils');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, ...options
    } = req.query;

    const queryFields = Object.keys(Build.rawAttributes);

    const query = {
      where: buildWhereQuery(options, queryFields),
    };

    const pagination = await paginate(Build, buildSerializer.serialize, { limit, page }, query);

    const json = {
      meta: {},
      ...pagination,
    };

    res.json(json);
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
