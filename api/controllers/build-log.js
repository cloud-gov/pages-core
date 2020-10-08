const { wrapHandlers } = require('../utils');
const buildLogSerializer = require('../serializers/build-log');
const { Build, BuildLog, sequelize } = require('../models');
const BuildLogs = require('../services/build-logs');

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
    const lineLimit = 1000;
    const byteLimit = lineLimit * 100;

    const { params, user } = req;
    const { build_id: buildId, page: pageStr = '1' } = params;
    const page = parseInt(pageStr, 10);

    const lineOffset = lineLimit * (page - 1);
    const byteOffset = byteLimit * (page - 1);

    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    if (build.logsS3Key) {
      const buildLogs = [];
      const output = await BuildLogs.getBuildLogs(build, byteOffset, byteOffset + byteLimit - 1);
      if (output) {
        buildLogs.push({ source: 'ALL', output });
      }
      return res.ok(buildLogs);
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

    const buildLogs = await sequelize.query(query, {
      model: BuildLog,
      replacements: {
        buildid: build.id,
        limit: lineLimit,
        offset: lineOffset,
      },
    });

    const serializedBuildLogs = buildLogSerializer.serializeMany(buildLogs);

    return res.ok(serializedBuildLogs);
  },
});
