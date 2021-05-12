const { QueryTypes } = require('sequelize');
const { Op } = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const config = require('../../../config');
const {
  Build, BuildLog, Site, Event, sequelize,
} = require('../../models');
const S3Helper = require('../S3Helper');
const EventCreator = require('../EventCreator');

const BuildLogs = {
  s3() {
    return new S3Helper.S3Client(config.s3BuildLogs);
  },

  buildKey(site, build) {
    return `${site.owner}/${site.repository}/${build.id}`;
  },

  async fetchBuildLogs(build, offset) {
    const query = `
      SELECT COUNT(*) as numlines,
             STRING_AGG(bl.output, '\n') as logs
        FROM (
          SELECT output
            FROM buildlog
          WHERE build = :buildid
        ORDER BY id
        ${offset ? 'OFFSET :offset' : ''}
        ) AS bl
    `;

    return sequelize.query(query, {
      replacements: {
        buildid: build.id,
        offset,
      },
      plain: true,
      raw: true,
      type: QueryTypes.SELECT,
    });
  },

  async archiveBuildLogs(site, build) {
    const key = this.buildKey(site, build);
    const { logs } = await this.fetchBuildLogs(build);
    if (!logs) {
      return;
    }

    await this.s3().putObject(logs, key);
    await build.update({ logsS3Key: key });
    await BuildLog.destroy({ where: { build: build.id } });
  },

  async archiveBuildLogsForBuildId(buildId) {
    const build = await Build.findOne({
      where: { id: buildId },
      include: [{
        model: Site,
        required: true,
        // If the site has been deleted we still want to archive the logs
        paranoid: false,
      }],
    });
    return this.archiveBuildLogs(build.Site, build);
  },

  async getBuildLogs(build, startBytes, endBytes) {
    const params = {};
    try {
      if (startBytes !== undefined && endBytes !== undefined) {
        params.Range = `bytes=${startBytes}-${endBytes}`;
      }
      const response = await this.s3().getObject(build.logsS3Key, params);
      return response.Body.toString();
    } catch (error) {
      if (error.code === 'InvalidRange') {
        return null;
      }
      throw error;
    }
  },

  async archiveBuildLogsByDate(startDate, endDate) {
    if (startDate > endDate) {
      throw new Error('end date must be after start date');
    }
    const builds = await Build.findAll({
      attributes: ['id'],
      where: {
        completedAt: {
          [Op.gte]: startDate, // .toDate(),
          [Op.lt]: endDate, // .toDate(),
        },
      },
    });

    return PromisePool
      .withConcurrency(5)
      .for(builds)
      .process(build => BuildLogs.archiveBuildLogsForBuildId(build.id)
        .then(() =>
          EventCreator.audit(Event.labels.BUILDLOG_ARCHIVED, build, 'archived build logs'))
        .catch(err =>
          EventCreator.error(Event.labels.BUILDLOG_ARCHIVED, err, { buildId: build.id })));
  },
};

module.exports = BuildLogs;
