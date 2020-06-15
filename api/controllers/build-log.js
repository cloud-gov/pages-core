const Seq = require('sequelize');
const { wrapHandlers } = require('../utils');
const buildLogSerializer = require('../serializers/build-log');
const { Build, BuildLog, sequelize } = require('../models');

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

    const buildLogJSON = buildLogSerializer.serialize(buildLog);

    return res.ok(buildLogJSON);
  },

  find: async (req, res) => {
    const limit = 5;
    // 1,000 lines/records
    const lineLimit = 1000;

    const { params, user } = req;
    const { build_id: buildId, page = 1 } = params;

    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const query = `
        SELECT bl.build, bl.source, STRING_AGG(bl.output, '\n') as output
          FROM (
            SELECT build, source, output
              FROM buildlog
             WHERE build = :buildid
               AND source = 'ALL'
          ORDER BY id
                   OFFSET :offset
                   FETCH NEXT :limit ROWS ONLY
          ) AS bl
      GROUP BY bl.build, bl.source
    `;

    let buildLogs = await sequelize.query(query, {
      model: BuildLog,
      replacements: {
        buildid: build.id,
        limit: lineLimit,
        offset: (lineLimit * (page - 1)),
      },
    });

    // Support legacy build logs
    if (buildLogs.length === 0) {
      buildLogs = await BuildLog.findAll({
        where: {
          build: build.id,
          source: { [Seq.Op.ne]: 'ALL' },
        },
        order: [['id', 'ASC']],
        offset: (limit * (page - 1)),
        limit,
      });
    }

    const serializedBuildLogs = buildLogSerializer.serializeMany(buildLogs);

    return res.ok(serializedBuildLogs);
  },
});
