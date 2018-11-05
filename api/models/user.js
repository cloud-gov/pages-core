const protectedAttributes = [
  'githubAccessToken',
  'githubUserId',
  'signedInAt',
  'SiteUser',
];
const associate = ({ User, Build, Site, UserAction, SiteUser }) => {
  User.hasMany(Build, {
    foreignKey: 'user',
  });
  User.belongsToMany(Site, {
    through: SiteUser,
    foreignKey: 'user_sites',
    timestamps: false,
  });
  User.hasMany(UserAction, {
    foreignKey: 'userId',
    as: 'userActions',
  });
  User.belongsToMany(User, {
    through: 'user_action',
    as: 'actionTarget',
    foreignKey: 'targetId',
    unique: false,
  });
};

function beforeValidate(user) {
  const { username } = user;
  const safeUsername = username && username.toLowerCase();
  user.username = safeUsername || null; // eslint-disable-line no-param-reassign
}

function toJSON() {
  const record = this.get({
    plain: true,
  });

  return Object.assign({}, Object.keys(record).reduce((out, attr) => {
    if (protectedAttributes.indexOf(attr) === -1) {
      out[attr] = record[attr]; // eslint-disable-line no-param-reassign
    }

    if (attr === 'SiteUser' && record[attr] && record[attr].buildNotify) {
      out.buildNotify = record[attr].buildNotify;
    }
    return out;
  }, {}), {
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

const tableOptions = {
  tableName: 'user',
  classMethods: {
    associate,
  },
  instanceMethods: {
    toJSON,
  },
  hooks: {
    beforeValidate,
  },
  paranoid: true,
  scopes: {
    withGithub: {
      where: {
        githubAccessToken: { $ne: null },
      },
    },
  },
};

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
  }, tableOptions);

  return User;
};
