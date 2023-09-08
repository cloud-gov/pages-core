const { Op } = require('sequelize');
const BuildTaskQueue = require('../services/BuildTaskQueue');

const associate = ({ BuildTaskType, Site, SiteBuildTask }) => {
  SiteBuildTask.belongsTo(BuildTaskType, {
    foreignKey: 'buildTaskTypeId',
    allowNull: false,
  });
  SiteBuildTask.belongsTo(Site, {
    foreignKey: 'siteId',
  });
};

async function startBuildTask(buildId) {
  const siteBuildTask = this;
  const {
    BuildTask,
    BuildTaskType,
    Build,
    Site,
  } = siteBuildTask.sequelize.models;

  const buildTask = await BuildTask.create({
    buildTaskTypeId: siteBuildTask.buildTaskTypeId,
    buildId,
    name: `build: ${buildId}, type: ${siteBuildTask.buildTaskTypeId}`,
  });

  const createdBuildTask = await BuildTask.findByPk(buildTask.id, {
    include: [
      { model: BuildTaskType, required: true },
      { model: Build, required: true, include: [{ model: Site, required: true }] },
    ],
  });

  BuildTaskQueue.sendTaskMessage(createdBuildTask);
}

async function findTasksToStart({ build, startsWhen }) {
  const {
    BuildTaskType,
  } = this.sequelize.models;
  return this.findAll({
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
    include: {
      model: BuildTaskType,
      where: { metadata: { startsWhen } },
      required: true,
    },
  });
}

async function startBuildTasks({ build, startsWhen }) {
  const tasks = await this.findTasksToStart({ build, startsWhen });
  await Promise.allSettled(tasks.map(sbt => sbt.startBuildTask(build.id)));
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
  SiteBuildTask.startBuildTasks = startBuildTasks;
  SiteBuildTask.findTasksToStart = findTasksToStart;
  SiteBuildTask.prototype.startBuildTask = startBuildTask;
  return SiteBuildTask;
};
