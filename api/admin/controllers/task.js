const { BuildTask, Build, BuildTaskType, SiteBuildTask, Site } = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');
const siteErrors = require('../../responses/siteErrors');
const { isEmptyOrBranch } = require('../../utils/validators');

module.exports = wrapHandlers({
  async list(req, res) {
    const { limit, page, site } = req.query;

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
              {
                model: Site,
                required: true,
              },
            ],
          },
        ],
      };
    }

    const pagination = await paginate(
      BuildTask.scope(scopes),
      (a) => a,
      { limit, page },
      query,
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
    const { branch, runDay } = req.body;
    const metadata = runDay ? { runDay } : {};

    try {
      isEmptyOrBranch(branch);
    } catch {
      return res.status(422).send({
        message: siteErrors.INVALID_BRANCH_NAME,
        errors: siteErrors.INVALID_BRANCH_NAME,
      });
    }

    await SiteBuildTask.create({
      buildTaskTypeId: req.body.buildTaskTypeId,
      siteId: req.params.id,
      branch,
      metadata,
    });

    return res.json({});
  },

  async updateSiteBuildTask(req, res) {
    const { id } = req.params;
    const { runDay } = req.body;

    const sbt = await SiteBuildTask.findByPk(id);

    await sbt.update({
      metadata: {
        ...sbt.metadata,
        runDay,
      },
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
