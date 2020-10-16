const { QueryTypes } = require('sequelize');
const config = require('../../../config');
const { BuildLog, sequelize } = require('../../models');
const S3Helper = require('../S3Helper');

const BuildLogs = {
  s3() {
    return new S3Helper.S3Client(config.s3BuildLogs);
  },

  buildKey(site, build) {
    return `${site.owner}/${site.repository}/${build.id}`;
  },

  async fetchBuildLogs(build) {
    const query = `
      SELECT STRING_AGG(bl.output, '\n') as output
        FROM (
          SELECT output
            FROM buildlog
          WHERE build = :buildid
        ORDER BY id
        ) AS bl
    `;

    const { output } = await sequelize.query(query, {
      replacements: {
        buildid: build.id,
      },
      plain: true,
      raw: true,
      type: QueryTypes.SELECT,
    });

    return output;
  },

  async archiveBuildLogs(site, build) {
    const key = this.buildKey(site, build);
    const logs = await this.fetchBuildLogs(build);
    if (!logs) {
      return;
    }

    await this.s3().putObject(logs, key);
    await build.update({ logsS3Key: key });
    await BuildLog.destroy({ where: { build: build.id } });
  },

  async getBuildLogs(build, startBytes, endBytes) {
    try {
      const params = { Range: `bytes=${startBytes}-${endBytes}` };
      const response = await this.s3().getObject(build.logsS3Key, params);
      return response.Body.toString();
    } catch (error) {
      if (error.code === 'InvalidRange') {
        return null;
      }
      throw error;
    }
  },
};

module.exports = BuildLogs;
