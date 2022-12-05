const moment = require('moment');
const { wrapHandlers } = require('../utils');
const { Build, BuildLog, sequelize } = require('../models');
const BuildLogs = require('../services/build-logs');

async function getBuildLogsFromS3(build, state, offset, limit) {
  const origin = 's3';

  const output = await BuildLogs.getBuildLogs(build, offset, offset + limit - 1);

  if (!output) {
    return {
      build,
      state,
      origin,
      offset,
      output_count: 0,
      output: [],
    };
  }

  return {
    build,
    state,
    origin,
    offset,
    output_count: output.length,
    output,
  };
}

const buildLogsQuery = `
  SELECT
    bl.build,
    bl.state,
    'database' as origin,
    :offset as offset,
    COUNT(bl.output) as output_count,
    ARRAY_AGG(bl.output) as output
    FROM (
      SELECT
        logs.build,
        b.state,
        logs.source,
        logs.output
      FROM
        buildlog as logs,
        build as b
      WHERE
        logs.build = :buildid AND
        b.id = :buildid AND
        logs.source = 'ALL'
      ORDER BY logs.id
      OFFSET :offset
      FETCH NEXT :limit ROWS ONLY
    ) AS bl
  GROUP BY bl.build, bl.state, bl.source
`;

async function getBuildLogsFromDatabase(build, state, offset, limit) {
  const origin = 'database';

  const results = await sequelize.query(buildLogsQuery, {
    model: BuildLog,
    replacements: {
      buildid: build.id,
      limit,
      offset,
    },
  });

  const buildLogs = results[0];

  if (!buildLogs) {
    return {
      build,
      state,
      origin,
      offset,
      output_count: 0,
      output: [],
    };
  }

  return buildLogs;
}

module.exports = wrapHandlers({
  find: async (req, res) => {
    const lineLimit = 1000;
    const byteLimit = lineLimit * 100;

    const { params, user } = req;
    const { build_id: buildId, offset: offsetStr = '0' } = params;
    const offset = parseInt(offsetStr, 10);

    const build = await Build.forSiteUser(user).findByPk(buildId);

    if (!build) {
      return res.notFound();
    }

    const buildLogs = build.logsS3Key
      ? await getBuildLogsFromS3(build, build.state, offset, byteLimit)
      : await getBuildLogsFromDatabase(build, build.state, offset, lineLimit);

    if (buildLogs.length === 0 && offset === 0) {
      const isExpired = moment(build.completedAt).isBefore(moment().subtract(179, 'days'));
      if (isExpired) {
        buildLogs.push({ source: 'ALL', output: 'Build logs are only retained for 180 days.' });
      }
    }

    return res.ok(buildLogs);
  },
});
