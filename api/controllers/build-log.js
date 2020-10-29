const moment = require('moment');
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

async function getBuildLogsFromS3(build, offset, limit) {
  const output = await BuildLogs.getBuildLogs(build, offset, offset + limit - 1);
  return output ? [{ source: 'ALL', output }] : [];
}

const buildLogsQuery = `
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

async function getBuildLogsFromDatabase(build, offset, limit) {
  const buildLogs = await sequelize.query(buildLogsQuery, {
    model: BuildLog,
    replacements: {
      buildid: build.id,
      limit,
      offset,
    },
  });

  return buildLogSerializer.serializeMany(buildLogs);
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

    const buildLogs = build.logsS3Key
      ? await getBuildLogsFromS3(build, byteOffset, byteLimit)
      : await getBuildLogsFromDatabase(build, lineOffset, lineLimit);

    if (buildLogs.length === 0 && page === 1) {
      const isExpired = moment(build.completedAt).isBefore(moment().subtract(179, 'days'));
      if (isExpired) {
        buildLogs.push({ source: 'ALL', output: 'Build logs are only retained for 180 days.' });
      }
    }

    return res.ok(buildLogs);
  },
});
