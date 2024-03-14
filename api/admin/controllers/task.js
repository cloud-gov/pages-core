/* eslint-disable no-await-in-loop */

const {
  BuildTask,
  BuildTaskType,
  SiteBuildTask,
} = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      limit, page, site,
    } = req.query;

    const scopes = [];
    let query = {};

    if (site) {
      scopes.push(BuildTask.siteScope(site));
    } else {
      // non-site scoped lists need this included explicitly
      query = { include: [BuildTaskType] };
    }

    const pagination = await paginate(
      BuildTask.scope(scopes),
      a => a,
      { limit, page },
      query
    );

    const json = {
      ...pagination,
    };

    return res.json(json);
  },

  async listTypes(req, res) {
    const types = await BuildTaskType.findAll();
    return res.json(types);
  },

  async addSiteBuildTask(req, res) {
    await SiteBuildTask.create({
      buildTaskTypeId: req.body.buildTaskTypeId,
      siteId: req.params.id,
      branch: req.body.branch,
      metadata: {},
    });

    return res.json({});
  },

  async removeSiteBuiltTask(req, res) {
    const { id } = req.params;

    const sbt = await SiteBuildTask.findByPk(id);
    await sbt.destroy();

    return res.json({});
  },
});
