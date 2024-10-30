const associate = ({ User, Site, SiteUser }) => {
  SiteUser.belongsTo(Site, {
    foreignKey: 'site_users',
    targetKey: 'id',
  });
  SiteUser.belongsTo(User, {
    foreignKey: 'user_sites',
    targetKey: 'id',
  });
};

module.exports = (sequelize, DataTypes) => {
  const SiteUser = sequelize.define(
    'SiteUser',
    {
      buildNotificationSetting: {
        type: DataTypes.ENUM,
        values: ['none', 'builds', 'site'],
        defaultValue: 'site',
      },
    },
    {
      tableName: 'site_users__user_sites',
      timestamps: false,
    },
  );

  SiteUser.associate = associate;

  return SiteUser;
};
