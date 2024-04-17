/* eslint-disable no-await-in-loop */

const {
  BuildTask,
  Build,
  BuildTaskType,
  SiteBuildTask,
  Site,
} = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');
const { getSignedTaskUrl, getTaskArtifactSize } = require('../../services/S3BuildTask');

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
      // TODO: avoid duplicating this logic here and in the model scope
      query = {
        include: [
          BuildTaskType,
          {
            model: Build,
            required: true,
            include: [
              { model: Site, required: true },
            ],
          },
        ],
      };
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

    const updatedTasks = await Promise.all(json.data.map(async (task) => {
      if (task.artifact) {
        const size = await getTaskArtifactSize(task.Build.Site, task.artifact);
        const url = await getSignedTaskUrl(task.Build.Site, task.artifact);
        // eslint-disable-next-line no-param-reassign
        task.artifact = { size, url };
      }
      return task;
    }));

    json.data = updatedTasks;

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
