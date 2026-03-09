const { Op } = require('sequelize');
const { toInt } = require('../utils');
const { encrypt, decrypt } = require('../services/Encryptor');
const { encryption } = require('../../config');
const { logger } = require('../../winston');

const associate = ({
  Build,
  FileStorageUserAction,
  Organization,
  OrganizationRole,
  Role,
  UAAIdentity,
  User,
  UserAction,
}) => {
  // Associations
  User.hasMany(Build, {
    foreignKey: 'user',
  });
  User.hasMany(FileStorageUserAction, {
    foreignKey: 'userId',
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
  User.hasMany(OrganizationRole, {
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
          {
            username: {
              [Op.substring]: search,
            },
          },
          {
            email: {
              [Op.substring]: search,
            },
          },
          {
            '$UAAIdentity.email$': {
              [Op.substring]: search,
            },
          },
        ],
      };
      query.include = UAAIdentity;
    }
    return query;
  });
  User.addScope('byOrg', (id) => ({
    include: [
      {
        model: Organization,
        where: { id },
      },
    ],
  }));
  User.addScope('withUAAIdentity', {
    include: UAAIdentity,
  });
  User.addScope('havingUAAIdentity', {
    include: [
      {
        model: UAAIdentity,
        required: true,
      },
    ],
  });
  User.addScope('withOrganizationRoles', {
    include: {
      model: OrganizationRole,
      include: [Organization, Role],
    },
    order: [[OrganizationRole, Organization, 'name', 'ASC']],
  });
  User.addScope('byUAAEmail', (uaaEmail) => ({
    include: [
      {
        model: UAAIdentity,
        where: {
          email: uaaEmail,
        },
        required: true,
      },
    ],
  }));
};

function beforeValidate(user) {
  const { username } = user;
  const safeUsername = username && username.toLowerCase();
  user.username = safeUsername || null;
}

function getEncryptedField(instance, field) {
  const val = instance.getDataValue(field);
  if (!val) return null;

  try {
    return decrypt(val, encryption.key);
  } catch (error) {
    logger.error(`Error decrypting GitLab token for field '${field}'.`, error);
    return null;
  }
}

function setEncryptedField(instance, field, val) {
  let encrypted = null;

  if (val) {
    try {
      encrypted = encrypt(val, encryption.key).ciphertext;
    } catch (error) {
      logger.error(`Error encrypting GitLab token for field '${field}'.`, error);
    }
  }

  instance.setDataValue(field, encrypted);
}

const attributes = (DataTypes) => ({
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
  __enc_gitlabToken: {
    type: DataTypes.TEXT,
    field: 'gitlabToken',
  },
  gitlabToken: {
    type: DataTypes.VIRTUAL,
    get() {
      return getEncryptedField(this, '__enc_gitlabToken');
    },
    set(val) {
      setEncryptedField(this, '__enc_gitlabToken', val);
    },
  },
  __enc_gitlabRefreshToken: {
    type: DataTypes.TEXT,
    field: 'gitlabRefreshToken',
  },
  gitlabRefreshToken: {
    type: DataTypes.VIRTUAL,
    get() {
      return getEncryptedField(this, '__enc_gitlabRefreshToken');
    },
    set(val) {
      setEncryptedField(this, '__enc_gitlabRefreshToken', val);
    },
  },
  gitlabExpiresAt: {
    type: DataTypes.TIME,
  },
  signedInAt: {
    type: DataTypes.DATE,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
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
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  buildNotificationSettings: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.settings.buildNotificationSettings || {};
    },
    set(buildNotificationSettings) {
      this.setDataValue('settings', {
        ...this.settings,
        buildNotificationSettings,
      });
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
        githubAccessToken: {
          [Op.ne]: null,
        },
      },
    },
  },
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', attributes(DataTypes), options);
  User.associate = associate;
  User.orgScope = (id) => ({
    method: ['byOrg', id],
  });
  User.searchScope = (search) => ({
    method: ['byIdOrText', search],
  });
  User.byUAAEmail = (id) =>
    User.scope({
      method: ['byUAAEmail', id],
    });
  return User;
};
