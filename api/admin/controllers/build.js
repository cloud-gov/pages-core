/* eslint-disable no-await-in-loop */
const buildSerializer = require('../../serializers/build');
const BuildLogs = require('../../services/build-logs');
const { Build, Site } = require('../../models');
const { buildWhereQuery, fetchModelById } = require('../../utils/queryDatabase');
const { wait } = require('../../utils');

function safeWrite(res, data) {
  if (data && !res.writableEnded) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

module.exports = {
  findAllBuilds: async (req, res) => {
    const { limit = 50, offset = 0, ...options } = req.query;

    const query = {
      where: {},
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    };

    const queryFields = Object.keys(Build.rawAttributes);
    const where = buildWhereQuery(options, queryFields);
    query.where = where;

    try {
      const builds = await Build.findAll(query);

      const buildJSON = await buildSerializer.serialize(builds);
      return res.json(buildJSON);
    } catch (error) {
      return res.error(error);
    }
  },

  findById: async (req, res) => {
    const {
      params: { id },
    } = req;

    const build = await fetchModelById(id, Build, { include: [Site] });
    if (!build) return res.notFound();

    return res.json(buildSerializer.serializeObject(build));
  },

  findBuildLog: async (req, res) => {
    const {
      params: { id },
    } = req;

    const build = await fetchModelById(id, Build);
    if (!build) return res.notFound();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    });
    res.flushHeaders();
    res.on('close', () => { res.end(); });
    res.write('\n');

    if (build.logsS3Key) {
      const logs = await BuildLogs.getBuildLogs(build);
      safeWrite(res, logs);
      return res.end();
    }

    let result = await BuildLogs.fetchBuildLogs(build);
    safeWrite(res, result.logs);

    if (build.isComplete()) {
      return res.end();
    }

    let offset = result.numlines;
    do {
      await wait();

      result = await BuildLogs.fetchBuildLogs(build, offset);
      safeWrite(res, result.logs);

      offset += result.numlines;
      await build.reload();
    } while (!build.isComplete() && !res.writableEnded);

    result = await BuildLogs.fetchBuildLogs(build, offset);
    safeWrite(res, result.logs);

    return res.end();
  },
};
