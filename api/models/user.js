const associate = ({ User, Build, Site }) => {
  User.hasMany(Build, {
    foreignKey: 'user',
  });
  User.belongsToMany(Site, {
    through: 'site_users__user_sites',
    foreignKey: 'user_sites',
    timestamps: false,
  });
};

function toJSON() {
  const object = this.get({
    plain: true,
  });

  delete object.githubAccessToken;
  delete object.githubUserId;
  delete object.signedInAt;

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });

  return object;
}

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    githubAccessToken: {
      type: DataTypes.STRING,
    },
    githubUserId: {
      type: DataTypes.STRING,
    },
    signedInAt: {
      type: DataTypes.DATE,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    tableName: 'user',
    classMethods: {
      associate,
    },
    instanceMethods: {
      toJSON,
    },
  });

  return User;
};
