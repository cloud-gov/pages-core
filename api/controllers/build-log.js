const siteAuthorizer = require('../authorizers/site');
const buildLogSerializer = require('../serializers/build-log');
const { Build, BuildLog } = require('../models');

function decodeb64(str) {
  if (str) {
    return new Buffer(str, 'base64').toString('utf8');
  }
  return null;
}

module.exports = {
  create: (req, res) => {
    Promise.resolve(Number(req.params.build_id))
    .then((id) => {
      if (isNaN(id)) { throw 404; }
      return Build.findById(id);
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

  find: (req, res) => {
    let build;
    const limit = 5;

    const isPlaintext = req.query.format &&
      req.query.format.toLowerCase() === 'text';

    return Promise.resolve(Number(req.params.build_id))
      .then((id) => {
        if (isNaN(id)) {
          throw 404;
        }
        return Build.findById(id);
      }).then((model) => {
        build = model;
        if (!build) {
          throw 404;
        }
        return siteAuthorizer.findOne(req.user, { id: build.site });
      })
      .then(() =>
        Promise.resolve(Number(req.params.page) || 1)
        .then(page => BuildLog.findAll({
          attributes: ['id'],
          where: { build: build.id },
          order: [['id', 'ASC']],
          offset: (limit * (page - 1)),
          limit,
        }))
      )
      .then(buildLogs => buildLogSerializer.serialize(buildLogs, { isPlaintext }))
      .then((serializedBuildLogs) => {
        if (isPlaintext) {
          // .findAll always resolves to an array, so join is available
          res.type('text').send(serializedBuildLogs.join('\n\n'));
        } else {
          res.json(serializedBuildLogs);
        }
      })
      .catch((err) => {
        res.error(err);
      });
  },
};
