const associate = ({ UserOauthProvider, User }) => {
  UserOauthProvider.belongsTo(User, {
    foreignKey: 'userId',
    allowNull: false,
  });
};

module.exports = (sequelize, DataTypes) => {
  const UserOauthProvider = sequelize.define(
    'UserOauthProvider',
    {
      userId: {
        type: DataTypes.INTEGER,
        references: 'User',
        allowNull: false,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      providerUserId: {
        type: DataTypes.STRING,
      },
      accessToken: {
        type: DataTypes.TEXT,
      },
      refreshToken: {
        type: DataTypes.TEXT,
      },
      expiresAt: {
        type: DataTypes.TIME,
      },
    },
    {
      paranoid: true,
      tableName: 'user_oauth_provider',
    },
  );

  UserOauthProvider.associate = associate;

  return UserOauthProvider;
};
