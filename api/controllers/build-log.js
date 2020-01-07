const { wrapHandlers } = require('../utils');
const buildLogSerializer = require('../serializers/build-log');
const { Build, BuildLog } = require('../models');

function decodeb64(str) {
  if (str) {
    return Buffer.from(str, 'base64').toString('utf8');
  }
  return null;
}

module.exports = wrapHandlers({
  create: async (req, res) => {
    const { build_id: buildId, token } = req.params;

    const build = await Build.findOne({ where: { id: buildId, token } });

    if (!build) {
      return res.notFound();
    }

    const { output, source } = req.body;

    const buildLog = await BuildLog.create({
      build: build.id,
      output: decodeb64(output),
      source,
    });

    const buildLogJSON = await buildLogSerializer.serialize(buildLog);

    return res.ok(buildLogJSON);
  },

  find: async (req, res) => {
    const limit = 5;
    const { params, user } = req;
    const { build_id: buildId, page = 1 } = params;

    const build = await Build.forUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const buildLogs = await BuildLog.findAll({
      where: { build: build.id },
      order: [['id', 'ASC']],
      offset: (limit * (page - 1)),
      limit,
      include: [Build],
    });

    const serializedBuildLogs = await buildLogSerializer.serialize(buildLogs);

    return res.ok(serializedBuildLogs);
  },
});
