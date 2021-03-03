const associate = ({ Site, User, UserEnvironmentVariable }) => {
  // Associations
  UserEnvironmentVariable.belongsTo(Site, {
    foreignKey: 'siteId',
    allowNull: false,
  });

  // Scopes
  UserEnvironmentVariable.addScope('forSiteUser', user => ({
    include: [{
      model: Site,
      required: true,
      include: [{
        model: User,
        where: {
          id: user.id,
        },
      }],
    }],
  }));
};

module.exports = (sequelize, DataTypes) => {
  const UserEnvironmentVariable = sequelize.define('UserEnvironmentVariable', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ciphertext: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hint: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return '';
      },
    },
  }, {
    tableName: 'user_environment_variable',
    timestamps: true,
    updatedAt: false,
  });
  UserEnvironmentVariable.associate = associate;
  UserEnvironmentVariable.forSiteUser = user => UserEnvironmentVariable
    .scope({ method: ['forSiteUser', user] });
  return UserEnvironmentVariable;
};
