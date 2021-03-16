const { Op } = require('sequelize');
const { toInt } = require('../utils');

const associate = ({
  Build,
  Organization,
  OrganizationRole,
  Site,
  SiteUser,
  UAAIdentity,
  User,
  UserAction,
}) => {
  // Associations
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
  User.hasOne(UAAIdentity, {
    foreignKey: 'userId',
  });

  // Scopes
  User.addScope('byIdOrText', (search) => {
    const query = {};

    const id = toInt(search);
    if (id) {
      query.where = { id };
    } else {
      query.where = {
        [Op.or]: [
          { username: { [Op.substring]: search } },
          { email: { [Op.substring]: search } },
        ],
      };
    }
    return query;
  });
  User.addScope('byOrg', id => ({
    include: [{
      model: Organization,
      where: { id },
    }],
  }));
  User.addScope('bySite', id => ({
    include: [{
      model: Site,
      where: { id },
    }],
  }));
  User.addScope('withUAAIdentity', {
    include: UAAIdentity,
  });
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
  User.orgScope = id => ({ method: ['byOrg', id] });
  User.siteScope = id => ({ method: ['bySite', id] });
  User.searchScope = search => ({ method: ['byIdOrText', search] });
  return User;
};
