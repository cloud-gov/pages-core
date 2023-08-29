const associate = ({
  BuildTaskType,
  BuildTask,
}) => {
  // Associations
  BuildTaskType.hasMany(BuildTask, {
    foreignKey: 'build_task_type',
  });
};

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
    }
  );

  BuildTaskType.associate = associate;
  return BuildTaskType;
};
