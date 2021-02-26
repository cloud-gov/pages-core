const associate = ({
  Organization,
  OrganizationRole,
  Site,
  User,
}) => {
  Organization.belongsToMany(User, {
    through: OrganizationRole,
    foreignKey: 'organizationId',
    otherKey: 'userId',
  });
  Organization.hasMany(Site, {
    foreignKey: 'organizationId',
  });
};

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    paranoid: true,
    tableName: 'organization',
  });

  Organization.associate = associate;

  return Organization;
};
