const associate = ({ UAAIdentity, User }) => {
  UAAIdentity.belongsTo(User, {
    foreignKey: 'userId',
    allowNull: false,
  });
};

module.exports = (sequelize, DataTypes) => {
  const UAAIdentity = sequelize.define('UAAIdentity', {
    uaaId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    userName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
    },
    refreshToken: {
      type: DataTypes.TEXT,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: 'User',
    },
  }, {
    paranoid: true,
    tableName: 'uaa_identity',
  });

  UAAIdentity.associate = associate;

  return UAAIdentity;
};
