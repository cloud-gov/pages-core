const associate = ({ BuildTaskType, Site, SiteBuildTask }) => {
  SiteBuildTask.belongsTo(BuildTaskType, {
    foreignKey: 'buildTaskTypeId',
    allowNull: false,
  });
  SiteBuildTask.belongsTo(Site, {
    foreignKey: 'siteId',
  });
};

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

  return SiteBuildTask;
};
