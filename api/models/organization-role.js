const associate = ({
  OrganizationRole,
  Role,
  User,
}) => {
  // Associations
  OrganizationRole.belongsTo(User, {
    foreignKey: 'userId',
  });
  OrganizationRole.belongsTo(Role, {
    foreignKey: 'roleId',
  });
};

module.exports = (sequelize, DataTypes) => {
  const OrganizationRole = sequelize.define('OrganizationRole', {
    organizationId: {
      type: DataTypes.INTEGER,
      references: 'Organization',
    },
    userId: {
      type: DataTypes.INTEGER,
      references: 'User',
    },
    roleId: {
      type: DataTypes.INTEGER,
      references: 'Role',
    },
  }, {
    tableName: 'organization_role',
    indexes: [{
      unique: true,
      fields: ['organizationId', 'userId'],
      name: 'organization_role_organization_user_idx',
    }],
  });

  OrganizationRole.associate = associate;

  return OrganizationRole;
};
