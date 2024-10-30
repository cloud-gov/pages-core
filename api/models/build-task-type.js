const { buildEnum } = require('../utils');

const associate = ({ BuildTaskType, BuildTask, SiteBuildTask }) => {
  // Associations
  BuildTaskType.hasMany(BuildTask, {
    foreignKey: 'buildTaskTypeId',
  });
  BuildTaskType.hasMany(SiteBuildTask, {
    foreignKey: 'buildTaskTypeId',
  });
};

const Runners = buildEnum(['cf_task', 'worker']);

const StartsWhens = buildEnum(['build', 'complete']);

module.exports = (sequelize, DataTypes) => {
  const BuildTaskType = sequelize.define(
    'BuildTaskType',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
      },
      runner: {
        type: DataTypes.ENUM,
        values: Runners.values,
        allowNull: false,
        validate: {
          isIn: [Runners.values],
        },
      },
      startsWhen: {
        type: DataTypes.ENUM,
        values: StartsWhens.values,
        allowNull: false,
        validate: {
          isIn: [StartsWhens.values],
        },
      },
      url: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'build_task_type',
    },
  );

  BuildTaskType.associate = associate;
  BuildTaskType.Runners = Runners;
  BuildTaskType.StartsWhens = StartsWhens;
  return BuildTaskType;
};
