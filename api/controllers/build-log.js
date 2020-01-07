const buildLogSerializer = require('../serializers/build-log');
const { Build, BuildLog } = require('../models');

function decodeb64(str) {
  if (str) {
    return Buffer.from(str, 'base64').toString('utf8');
  }
  return null;
}

module.exports = {
  create: (req, res) => {
    Promise.resolve(Number(req.params.build_id))
      .then((id) => {
        if (isNaN(id)) { throw 404; }
        return Build.findByPk(id);
      })
      .then((build) => {
        if (!build) {
          throw 404;
        } else if (build.token !== req.params.token) {
          throw 403;
        }

        return BuildLog.create({
          build: build.id,
          output: decodeb64(req.body.output),
          source: req.body.source,
        });
      })
      .then(buildLog => buildLogSerializer.serialize(buildLog))
      .then((buildLogJSON) => { res.json(buildLogJSON); })
      .catch((err) => {
        res.error(err);
      });
  },

  find: async (req, res) => {
    const limit = 5;
    const { params, user } = req;
    const { build_id: buildId, page = 1 } = params;

    const build = await Build.forUser(user).findByPk(buildId);

    if (!build) {
      return res.status(404).send('Not Found');
    }

    const buildLogs = await BuildLog.findAll({
      where: { build: build.id },
      order: [['id', 'ASC']],
      offset: (limit * (page - 1)),
      limit,
      include: [Build],
    });

    const serializedBuildLogs = await buildLogSerializer.serialize(buildLogs);

    return res.json(serializedBuildLogs);
  },
};
