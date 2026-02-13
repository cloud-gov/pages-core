const { isEmptyOrBranch } = require('../utils/validators');
const associate = ({ BuildTask, BuildTaskType, Site, SiteBuildTask }) => {
  SiteBuildTask.belongsTo(BuildTaskType, {
    foreignKey: 'buildTaskTypeId',
    allowNull: false,
  });
  SiteBuildTask.belongsTo(Site, {
    foreignKey: 'siteId',
  });
  SiteBuildTask.hasMany(BuildTask, {
    foreignKey: 'siteBuildTaskId',
  });
};

async function createBuildTask(build) {
  const { BuildTask } = this.sequelize.models;

  if (build.state === 'invalid') {
    throw new Error('Can not create build task for invalid build.');
  }

  return BuildTask.create({
    buildTaskTypeId: this.buildTaskTypeId,
    buildId: build.id,
    siteBuildTaskId: this.id,
    name: `build: ${build.id}, type: ${this.buildTaskTypeId}`,
  });
}

module.exports = (sequelize, DataTypes) => {
  const SiteBuildTask = sequelize.define(
    'SiteBuildTask',
    {
      branch: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmptyOrBranch,
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'site_build_task',
      paranoid: true,
    },
  );

  SiteBuildTask.associate = associate;
  SiteBuildTask.prototype.createBuildTask = createBuildTask;
  return SiteBuildTask;
};
