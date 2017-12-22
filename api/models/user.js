const protectedAttributes = [
  'githubAccessToken',
  'githubUserId',
  'signedInAt',
  'site_users__user_sites',
];
const associate = ({ User, Build, Site, UserAction }) => {
  User.hasMany(Build, {
    foreignKey: 'user',
  });
  User.belongsToMany(Site, {
    through: 'site_users__user_sites',
    foreignKey: 'user_sites',
    timestamps: false,
  });
  User.hasMany(UserAction, {
    as: 'userAction',
    foreignKey: 'userId',
  });
  User.belongsToMany(User, {
    through: 'user_action',
    as: 'actionTarget',
    constraints: false,
    unique: false,
    foreignKey: 'targetId',
  });
};

function toJSON() {
  const object = this.get({
    plain: true,
  });

  return Object.assign({}, Object.keys(object).reduce((out, attr) => {
    if (protectedAttributes.indexOf(attr) !== -1) {
      return out;
    }

    out[attr] = object[attr];

    return out;
  }, {}), {
    createdAt: object.createdAt.toISOString(),
    updatedAt: object.updatedAt.toISOString(),
  });
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
    paranoid: true,
  });

  return User;
};
