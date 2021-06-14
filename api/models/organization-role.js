const associate = ({
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
}) => {
  // Associations
  OrganizationRole.belongsTo(User, {
    foreignKey: 'userId',
  });
  OrganizationRole.belongsTo(Organization, {
    foreignKey: 'organizationId',
  });
  OrganizationRole.belongsTo(Role, {
    foreignKey: 'roleId',
  });

  // Scopes
  OrganizationRole.addScope('forUser', user => ({
    where: {
      userId: user.id,
    },
    include: [
      Organization,
      Role,
    ],
  }));

  OrganizationRole.addScope('forOrganization', org => ({
    where: {
      organizationId: org.id,
    },
    include: [
      Role,
      {
        model: User,
        include: UAAIdentity,
      },
    ],
  }));
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
  OrganizationRole.forUser = user => OrganizationRole.scope({ method: ['forUser', user] });
  OrganizationRole.forOrganization = org => OrganizationRole.scope({ method: ['forOrganization', org] });
  return OrganizationRole;
};
