const defaultRoles = ['manager', 'user'];

module.exports = (sequelize, DataTypes) => {
  const createDefaultRoles = () =>
    Promise.all(defaultRoles.map((name) => sequelize.models.Role.create({ name })));

  const Role = sequelize.define(
    'Role',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'role',
    },
  );

  Role.createDefaultRoles = createDefaultRoles;

  return Role;
};
