const { Op } = require('sequelize');

const associate = ({ BuildTaskType, Site, SiteBuildTask }) => {
  SiteBuildTask.belongsTo(BuildTaskType, {
    foreignKey: 'buildTaskTypeId',
    allowNull: false,
  });
  SiteBuildTask.belongsTo(Site, {
    foreignKey: 'siteId',
  });
};

async function createBuildTasks({ build }) {
  const {
    BuildTask,
  } = this.sequelize.models;

  const siteBuildTasks = await this.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { branch: build.branch },
            { branch: null },
          ],
        },
        {
          siteId: build.site,
        },
      ],
    },
  });

  return Promise.all(siteBuildTasks.map(async siteBuildTask => BuildTask.create({
    buildTaskTypeId: siteBuildTask.buildTaskTypeId,
    buildId: build.id,
    name: `build: ${build.id}, type: ${siteBuildTask.buildTaskTypeId}`,
  })));
}

module.exports = (sequelize, DataTypes) => {
  const SiteBuildTask = sequelize.define(
    'SiteBuildTask',
    {

      branch: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    }, {
      tableName: 'site_build_task',
      paranoid: true,
    }
  );

  SiteBuildTask.associate = associate;
  SiteBuildTask.createBuildTasks = createBuildTasks;
  return SiteBuildTask;
};
