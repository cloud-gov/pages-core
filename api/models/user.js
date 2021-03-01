const { Op } = require('sequelize');

const associate = ({
  Build,
  Organization,
  OrganizationRole,
  Site,
  SiteUser,
  User,
  UserAction,
}) => {
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
  User.belongsToMany(Organization, {
    through: OrganizationRole,
    foreignKey: 'userId',
    otherKey: 'organizationId',
  });

  User.addScope('byOrg', id => ({
    include: [{
      model: Organization,
      where: { id },
    }],
  }));

  User.addScope('bySite', id => ({
    include: [{
      model: Organization,
      where: { id },
    }],
  }));
};

function beforeValidate(user) {
  const { username } = user;
  const safeUsername = username && username.toLowerCase();
  user.username = safeUsername || null; // eslint-disable-line no-param-reassign
}

const attributes = DataTypes => ({
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  pushedAt: {
    type: DataTypes.DATE,
  },
  adminEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
    },
  },
});

const options = {
  tableName: 'user',
  hooks: {
    beforeValidate,
  },
  paranoid: true,
  scopes: {
    withGithub: {
      where: {
        githubAccessToken: { [Op.ne]: null },
      },
    },
  },
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', attributes(DataTypes), options);
  User.associate = associate;
  return User;
};
